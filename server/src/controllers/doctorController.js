const pool = require("../config/db");
const bcrypt = require("bcryptjs");

const publicDoctorFrom = `
  SELECT d.id,
         u.full_name AS name,
         d.specialty,
         d.qualifications,
         d.consultation_fee,
         d.is_available,
         c.id AS clinic_id,
         c.name AS clinic_name,
         c.city,
         c.region,
         COALESCE(service_list.services, '[]'::json) AS services
    FROM doctors d
    JOIN users u ON u.id = d.user_id AND u.role = 'doctor' AND u.is_active = TRUE
    JOIN clinics c ON c.id = d.clinic_id
    LEFT JOIN LATERAL (
      SELECT json_agg(json_build_object(
        'id', s.id,
        'name', s.name,
        'description', s.description,
        'fee', s.fee
      ) ORDER BY s.name) AS services
        FROM doctor_services ds
        JOIN services s ON s.id = ds.service_id AND s.clinic_id = ds.clinic_id
       WHERE ds.doctor_id = d.id
         AND ds.clinic_id = d.clinic_id
         AND ds.is_active = TRUE
         AND s.is_active = TRUE
    ) service_list ON TRUE
`;

const sendDatabaseFailure = (error, res, message) => {
  console.error("Doctor management database error:", error.message);

  if (error.code === "23505") {
    return res.status(409).json({ success: false, message: "A conflicting doctor record already exists." });
  }

  if (error.code === "23503" || error.code === "23514") {
    return res.status(400).json({ success: false, message: "The requested doctor data is not valid." });
  }

  return res.status(500).json({ success: false, message });
};

const withTransaction = async (operation) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const result = await operation(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error("Doctor management transaction rollback failed:", rollbackError.message);
    }

    throw error;
  } finally {
    client.release();
  }
};

const writeAudit = (client, { actorId, action, entityId, details = {} }) =>
  client.query(
    `INSERT INTO audit_logs (actor_id, action, entity, entity_id, details)
     VALUES ($1, $2, 'doctors', $3, $4::jsonb)`,
    [actorId, action, String(entityId), JSON.stringify(details)]
  );

const getPublicDoctors = async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 12);
  const offset = (page - 1) * limit;
  const filters = [
    "d.is_active = TRUE",
    "d.is_profile_approved = TRUE",
    "c.verification_status = 'verified'",
    "c.operational_status = 'active'",
  ];
  const values = [];
  const addFilter = (sql, value) => {
    values.push(value);
    filters.push(sql.replace("?", `$${values.length}`));
  };

  if (req.query.search) {
    const search = `%${String(req.query.search).trim()}%`;
    values.push(search, search);
    filters.push(`(u.full_name ILIKE $${values.length - 1} OR d.specialty ILIKE $${values.length})`);
  }

  if (req.query.specialty) addFilter("d.specialty ILIKE ?", `%${String(req.query.specialty).trim()}%`);
  if (req.query.clinic_id) addFilter("c.id = ?", Number(req.query.clinic_id));
  if (req.query.clinic) addFilter("c.name ILIKE ?", `%${String(req.query.clinic).trim()}%`);
  if (req.query.city) addFilter("c.city ILIKE ?", `%${String(req.query.city).trim()}%`);

  const whereClause = filters.join(" AND ");
  const orderColumns = {
    name: "u.full_name",
    specialty: "d.specialty",
    fee: "d.consultation_fee",
  };
  const orderColumn = orderColumns[req.query.sort] || orderColumns.name;
  const orderDirection = req.query.order === "desc" ? "DESC" : "ASC";

  try {
    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS total
         FROM doctors d
         JOIN users u ON u.id = d.user_id AND u.role = 'doctor' AND u.is_active = TRUE
         JOIN clinics c ON c.id = d.clinic_id
        WHERE ${whereClause}`,
      values
    );
    const result = await pool.query(
      `${publicDoctorFrom}
        WHERE ${whereClause}
        ORDER BY ${orderColumn} ${orderDirection}, d.id ASC
        LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      [...values, limit, offset]
    );

    return res.status(200).json({
      success: true,
      data: {
        doctors: result.rows,
        pagination: {
          page,
          limit,
          total: countResult.rows[0].total,
          pages: Math.ceil(countResult.rows[0].total / limit),
        },
      },
    });
  } catch (error) {
    return sendDatabaseFailure(error, res, "Unable to load public doctors.");
  }
};

const getPublicDoctorById = async (req, res) => {
  try {
    const result = await pool.query(
      `${publicDoctorFrom}
        WHERE d.id = $1
          AND d.is_active = TRUE
          AND d.is_profile_approved = TRUE
          AND c.verification_status = 'verified'
          AND c.operational_status = 'active'`,
      [req.params.id]
    );

    if (!result.rowCount) {
      return res.status(404).json({ success: false, message: "Doctor profile not found." });
    }

    return res.status(200).json({
      success: true,
      data: {
        doctor: result.rows[0],
        doctors: result.rows,
      },
    });
  } catch (error) {
    return sendDatabaseFailure(error, res, "Unable to load the doctor profile.");
  }
};

const getClinicDoctorCandidates = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.full_name, u.email
         FROM users u
        WHERE u.role = 'doctor'
          AND u.is_active = TRUE
          AND NOT EXISTS (
            SELECT 1
              FROM doctors d
             WHERE d.user_id = u.id
               AND d.clinic_id = $1
               AND d.is_active = TRUE
          )
        ORDER BY u.full_name`,
      [req.params.clinicId],
    );

    return res.status(200).json({ success: true, data: { candidates: result.rows } });
  } catch (error) {
    return sendDatabaseFailure(error, res, "Unable to load eligible doctor accounts.");
  }
};

const createDoctorAccountAndProfile = async (req, res) => {
  try {
    const doctor = await withTransaction(async (client) => {
      const clinic = await client.query(
        `SELECT id, verification_status, operational_status
           FROM clinics WHERE id = $1 FOR SHARE`,
        [req.params.clinicId]
      );
      if (!clinic.rowCount) {
        const error = new Error("Clinic not found.");
        error.status = 404;
        throw error;
      }
      if (clinic.rows[0].verification_status !== "verified" || clinic.rows[0].operational_status === "suspended") {
        const error = new Error("Doctors can be assigned only to an active, verified clinic.");
        error.status = 409;
        throw error;
      }

      const passwordHash = await bcrypt.hash(req.body.password, 12);
      const userResult = await client.query(
        `INSERT INTO users
           (full_name, email, password_hash, phone, role, is_active, is_verified)
         VALUES ($1, $2, $3, $4, 'doctor', TRUE, TRUE)
         RETURNING id`,
        [
          req.body.full_name.trim(),
          req.body.email.trim().toLowerCase(),
          passwordHash,
          req.body.phone?.trim() || null,
        ]
      );

      const profileResult = await client.query(
        `INSERT INTO doctors
           (user_id, clinic_id, specialty, qualifications, license_number,
            consultation_fee, is_available, is_active, is_profile_approved)
         VALUES ($1, $2, $3, $4, $5, $6, TRUE, TRUE, TRUE)
         RETURNING id, user_id, clinic_id, specialty, qualifications,
                   license_number, consultation_fee, is_available, is_active,
                   is_profile_approved, created_at, updated_at`,
        [
          userResult.rows[0].id,
          req.params.clinicId,
          req.body.specialty.trim(),
          req.body.qualifications?.trim() || null,
          req.body.license_number.trim(),
          req.body.consultation_fee ?? 0,
        ]
      );

      await writeAudit(client, {
        actorId: req.user.id,
        action: "doctor_account_and_profile_created",
        entityId: profileResult.rows[0].id,
        details: {
          clinic_id: String(req.params.clinicId),
          user_id: String(userResult.rows[0].id),
        },
      });
      return profileResult.rows[0];
    });

    return res.status(201).json({
      success: true,
      message: "Doctor account created and allocated to this clinic.",
      data: { doctor },
    });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ success: false, message: error.message });
    return sendDatabaseFailure(error, res, "Unable to create the doctor account and profile.");
  }
};

const resetDoctorPassword = async (req, res) => {
  try {
    await withTransaction(async (client) => {
      const doctor = await client.query(
        `SELECT d.user_id, u.email
           FROM doctors d
           JOIN users u ON u.id = d.user_id
          WHERE d.id = $1 AND d.clinic_id = $2 AND u.role = 'doctor'
          FOR SHARE`,
        [req.params.doctorId, req.params.clinicId]
      );
      if (!doctor.rowCount) {
        const error = new Error("Doctor profile not found for this clinic.");
        error.status = 404;
        throw error;
      }

      const passwordHash = await bcrypt.hash(req.body.new_password, 12);
      await client.query(
        "UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2 AND is_active = TRUE",
        [passwordHash, doctor.rows[0].user_id]
      );
      await writeAudit(client, {
        actorId: req.user.id,
        action: "doctor_password_reset",
        entityId: req.params.doctorId,
        details: { clinic_id: String(req.params.clinicId), email: doctor.rows[0].email },
      });
    });

    return res.status(200).json({
      success: true,
      message: "The doctor password was reset.",
    });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ success: false, message: error.message });
    return sendDatabaseFailure(error, res, "Unable to reset the doctor password.");
  }
};

const createDoctorProfile = async (req, res) => {
  try {
    const doctor = await withTransaction(async (client) => {
      const clinic = await client.query(
        `SELECT id, verification_status FROM clinics WHERE id = $1 FOR SHARE`,
        [req.params.clinicId]
      );

      if (!clinic.rowCount) {
        const error = new Error("Clinic not found.");
        error.status = 404;
        throw error;
      }

      if (clinic.rows[0].verification_status !== "verified") {
        const error = new Error("Doctors can be assigned only to verified clinics.");
        error.status = 409;
        throw error;
      }

      const user = await client.query(
        `SELECT id FROM users
          WHERE id = $1 AND role = 'doctor' AND is_active = TRUE
          FOR SHARE`,
        [req.body.user_id]
      );

      if (!user.rowCount) {
        const error = new Error("An active doctor account is required.");
        error.status = 400;
        throw error;
      }

      const inserted = await client.query(
        `INSERT INTO doctors
           (user_id, clinic_id, specialty, qualifications, license_number,
            consultation_fee, is_available, is_active, is_profile_approved)
         VALUES ($1, $2, $3, $4, $5, $6, TRUE, TRUE, TRUE)
         ON CONFLICT (user_id, clinic_id)
         DO UPDATE SET
           specialty = EXCLUDED.specialty,
           qualifications = EXCLUDED.qualifications,
           license_number = EXCLUDED.license_number,
           consultation_fee = EXCLUDED.consultation_fee,
           is_available = TRUE,
           is_active = TRUE,
           is_profile_approved = TRUE,
           updated_at = NOW()
         RETURNING id, user_id, clinic_id, specialty, qualifications,
                   license_number, consultation_fee, is_available, is_active,
                   is_profile_approved, created_at, updated_at`,
        [
          req.body.user_id,
          req.params.clinicId,
          req.body.specialty.trim(),
          req.body.qualifications?.trim() || null,
          req.body.license_number.trim(),
          req.body.consultation_fee ?? 0,
        ]
      );

      await writeAudit(client, {
        actorId: req.user.id,
        action: "doctor_profile_created",
        entityId: inserted.rows[0].id,
        details: { clinic_id: String(req.params.clinicId), user_id: String(req.body.user_id) },
      });

      return inserted.rows[0];
    });

    return res.status(201).json({
      success: true,
      message: "Doctor profile created.",
      data: { doctor },
    });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ success: false, message: error.message });
    return sendDatabaseFailure(error, res, "Unable to create the doctor profile.");
  }
};

const getClinicDoctors = async (req, res) => {
  const isManager = ["clinic_admin", "receptionist", "system_admin"].includes(req.user.role);
  const filters = ["d.clinic_id = $1"];

  if (!isManager) filters.push("d.is_active = TRUE", "d.is_available = TRUE", "d.is_profile_approved = TRUE");

  try {
    const result = await pool.query(
      `SELECT d.id, d.user_id, d.clinic_id, u.full_name AS name,
              ${isManager ? "u.email," : ""}
              d.specialty, d.qualifications,
              ${isManager ? "d.license_number," : ""}
              d.consultation_fee, d.is_available, d.is_active,
              d.is_profile_approved, d.created_at, d.updated_at
         FROM doctors d
         JOIN users u ON u.id = d.user_id AND u.role = 'doctor' AND u.is_active = TRUE
        WHERE ${filters.join(" AND ")}
        ORDER BY u.full_name`,
      [req.params.clinicId]
    );

    return res.status(200).json({ success: true, data: { doctors: result.rows } });
  } catch (error) {
    return sendDatabaseFailure(error, res, "Unable to load clinic doctors.");
  }
};

const getDoctorById = async (req, res) => {
  const isManager = ["clinic_admin", "receptionist", "system_admin"].includes(req.user.role);

  try {
    const result = await pool.query(
      `SELECT d.id, d.user_id, d.clinic_id, u.full_name AS name,
              ${isManager ? "u.email," : ""}
              d.specialty, d.qualifications,
              ${isManager ? "d.license_number," : ""}
              d.consultation_fee, d.is_available, d.is_active,
              d.is_profile_approved, d.created_at, d.updated_at
         FROM doctors d
         JOIN users u ON u.id = d.user_id AND u.role = 'doctor' AND u.is_active = TRUE
        WHERE d.id = $1
          AND d.clinic_id = $2
          AND ${isManager ? "TRUE" : "d.is_active = TRUE AND d.is_available = TRUE AND d.is_profile_approved = TRUE"}`,
      [req.params.doctorId, req.params.clinicId]
    );

    if (!result.rowCount) {
      return res.status(404).json({ success: false, message: "Doctor profile not found for this clinic." });
    }

    return res.status(200).json({ success: true, data: { doctor: result.rows[0] } });
  } catch (error) {
    return sendDatabaseFailure(error, res, "Unable to load the doctor profile.");
  }
};

const getMyDoctorProfile = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT d.id, d.user_id, d.clinic_id, d.specialty, d.qualifications,
              d.license_number, d.consultation_fee, d.is_available, d.is_active,
              d.is_profile_approved, d.created_at, d.updated_at,
              c.name AS clinic_name, c.city, c.region,
              COALESCE((
                SELECT json_agg(json_build_object(
                  'id', s.id,
                  'name', s.name,
                  'description', s.description,
                  'fee', s.fee
                ) ORDER BY s.name)
                  FROM doctor_services ds
                  JOIN services s ON s.id = ds.service_id AND s.clinic_id = ds.clinic_id
                 WHERE ds.doctor_id = d.id
                   AND ds.clinic_id = d.clinic_id
                   AND ds.is_active = TRUE
                   AND s.is_active = TRUE
              ), '[]'::json) AS services
         FROM doctors d
         JOIN clinics c ON c.id = d.clinic_id
        WHERE d.user_id = $1`,
      [req.user.id]
    );

    if (!result.rowCount) {
      return res.status(404).json({ success: false, message: "Doctor profile not found." });
    }

    return res.status(200).json({ success: true, data: { doctor: result.rows[0] } });
  } catch (error) {
    return sendDatabaseFailure(error, res, "Unable to load your doctor profile.");
  }
};

const updateDoctorFields = async ({ doctorId, clinicId, userId, fields, values, client }) => {
  const setClauses = fields.map((field, index) => `${field} = $${index + 1}`);
  const whereValues = [...values];
  const whereClauses = [];

  if (doctorId !== undefined) {
    whereClauses.push(`id = $${whereValues.length + 1}`);
    whereValues.push(doctorId);
  }

  if (clinicId !== undefined) {
    whereClauses.push(`clinic_id = $${whereValues.length + 1}`);
    whereValues.push(clinicId);
  }

  if (userId !== undefined) {
    whereClauses.push(`user_id = $${whereValues.length + 1}`);
    whereValues.push(userId);
  }

  return client.query(
    `UPDATE doctors
        SET ${setClauses.join(", ")}, updated_at = NOW()
      WHERE ${whereClauses.join(" AND ")}
      RETURNING id, user_id, clinic_id, specialty, qualifications,
                license_number, consultation_fee, is_available, is_active,
                is_profile_approved, created_at, updated_at`,
    whereValues
  );
};

const updateDoctorProfile = async (req, res) => {
  const allowedFields = new Set([
    "specialty",
    "qualifications",
    "license_number",
    "consultation_fee",
    "is_available",
    "is_active",
    "is_profile_approved",
  ]);
  const updates = Object.entries(req.body).filter(([field]) => allowedFields.has(field));
  const fields = updates.map(([field]) => field);
  const values = updates.map(([field, value]) => (
    field === "specialty" || field === "license_number" || field === "qualifications"
      ? (value === null ? null : value.trim())
      : value
  ));

  if (req.user.role === "clinic_admin") {
    const forbidden = fields.some((field) => field === "is_profile_approved" && req.body[field] !== true);
    if (forbidden) {
      return res.status(403).json({ success: false, message: "Clinic administrators may approve, but not revoke, public profiles." });
    }
  }

  try {
    const doctor = await withTransaction(async (client) => {
      const result = await updateDoctorFields({
        doctorId: req.params.doctorId,
        clinicId: req.params.clinicId,
        fields,
        values,
        client,
      });

      if (!result.rowCount) {
        const error = new Error("Doctor profile not found for this clinic.");
        error.status = 404;
        throw error;
      }

      if (req.body.is_active === false) {
        await client.query(
          "UPDATE doctor_services SET is_active = FALSE WHERE doctor_id = $1 AND clinic_id = $2",
          [req.params.doctorId, req.params.clinicId]
        );
      }

      await writeAudit(client, {
        actorId: req.user.id,
        action: "doctor_profile_updated",
        entityId: req.params.doctorId,
        details: { clinic_id: String(req.params.clinicId), fields },
      });

      return result.rows[0];
    });

    return res.status(200).json({ success: true, message: "Doctor profile updated.", data: { doctor } });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ success: false, message: error.message });
    return sendDatabaseFailure(error, res, "Unable to update the doctor profile.");
  }
};

const updateMyDoctorProfile = async (req, res) => {
  const fields = Object.keys(req.body);
  const values = fields.map((field) => {
    const value = req.body[field];
    if (field === "specialty" || field === "qualifications") return value === null ? null : value.trim();
    return value;
  });
  const updateFields = [...fields];
  if (fields.some((field) => ["specialty", "qualifications"].includes(field))) {
    updateFields.push("is_profile_approved");
    values.push(false);
  }

  try {
    const result = await withTransaction(async (client) => {
      const currentDoctors = await client.query(
        "SELECT id FROM doctors WHERE user_id = $1 AND is_active = TRUE FOR UPDATE",
        [req.user.id]
      );

      if (!currentDoctors.rowCount) {
        const error = new Error("Doctor profile not found.");
        error.status = 404;
        throw error;
      }

      const doctor = await updateDoctorFields({
        userId: req.user.id,
        fields: updateFields,
        values,
        client,
      });

      if (!doctor.rowCount) {
        const error = new Error("Doctor profile not found.");
        error.status = 404;
        throw error;
      }

      await writeAudit(client, {
        actorId: req.user.id,
        action: "doctor_self_profile_updated",
        entityId: doctor.rows[0].id,
        details: { fields },
      });
      return doctor.rows[0];
    });

    return res.status(200).json({
      success: true,
      message: "Profile updated. Professional details require clinic review before appearing publicly.",
      data: { doctor: result },
    });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ success: false, message: error.message });
    return sendDatabaseFailure(error, res, "Unable to update your doctor profile.");
  }
};

const removeDoctorFromClinic = async (req, res) => {
  try {
    const doctor = await withTransaction(async (client) => {
      const result = await client.query(
        `UPDATE doctors
            SET is_active = FALSE, is_available = FALSE, is_profile_approved = FALSE, updated_at = NOW()
          WHERE id = $1 AND clinic_id = $2
          RETURNING id`,
        [req.params.doctorId, req.params.clinicId]
      );

      if (!result.rowCount) {
        const error = new Error("Doctor profile not found for this clinic.");
        error.status = 404;
        throw error;
      }

      await client.query(
        "UPDATE doctor_services SET is_active = FALSE WHERE doctor_id = $1 AND clinic_id = $2",
        [req.params.doctorId, req.params.clinicId]
      );
      await writeAudit(client, {
        actorId: req.user.id,
        action: "doctor_clinic_assignment_deactivated",
        entityId: req.params.doctorId,
        details: { clinic_id: String(req.params.clinicId) },
      });
      return result.rows[0];
    });

    return res.status(200).json({
      success: true,
      message: "Clinic assignment deactivated; account and historical records were preserved.",
      data: { doctor },
    });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ success: false, message: error.message });
    return sendDatabaseFailure(error, res, "Unable to deactivate the clinic assignment.");
  }
};

const getDoctorServices = async (req, res) => {
  try {
    const doctorResult = await pool.query(
      "SELECT id FROM doctors WHERE id = $1 AND clinic_id = $2",
      [req.params.doctorId, req.params.clinicId]
    );

    if (!doctorResult.rowCount) {
      return res.status(404).json({ success: false, message: "Doctor profile not found for this clinic." });
    }

    const result = await pool.query(
      `SELECT s.id, s.name, s.description, s.fee, s.duration_minutes,
              s.is_active AS service_is_active, ds.is_active AS assignment_is_active
         FROM services s
         LEFT JOIN doctor_services ds
           ON ds.service_id = s.id
          AND ds.doctor_id = $2
          AND ds.clinic_id = $1
        WHERE s.clinic_id = $1
          ${["clinic_admin", "system_admin"].includes(req.user.role) ? "" : "AND s.is_active = TRUE AND ds.is_active = TRUE"}
        ORDER BY s.name`,
      [req.params.clinicId, req.params.doctorId]
    );

    return res.status(200).json({ success: true, data: { services: result.rows } });
  } catch (error) {
    return sendDatabaseFailure(error, res, "Unable to load doctor services.");
  }
};

const updateDoctorServices = async (req, res) => {
  const serviceIds = [...new Set(req.body.service_ids.map(Number))];

  try {
    const services = await withTransaction(async (client) => {
      const doctor = await client.query(
        "SELECT id FROM doctors WHERE id = $1 AND clinic_id = $2 AND is_active = TRUE FOR UPDATE",
        [req.params.doctorId, req.params.clinicId]
      );

      if (!doctor.rowCount) {
        const error = new Error("Active doctor profile not found for this clinic.");
        error.status = 404;
        throw error;
      }

      const valid = await client.query(
        `SELECT id FROM services
          WHERE clinic_id = $1 AND is_active = TRUE AND id = ANY($2::bigint[])
          FOR SHARE`,
        [req.params.clinicId, serviceIds]
      );

      if (valid.rowCount !== serviceIds.length) {
        const error = new Error("Every selected service must be active and offered by this clinic.");
        error.status = 400;
        throw error;
      }

      await client.query(
        `UPDATE doctor_services
            SET is_active = FALSE
          WHERE doctor_id = $1 AND clinic_id = $2
            AND NOT (service_id = ANY($3::bigint[]))`,
        [req.params.doctorId, req.params.clinicId, serviceIds]
      );

      if (serviceIds.length) {
        await client.query(
          `INSERT INTO doctor_services (doctor_id, service_id, clinic_id, is_active)
           SELECT $1, service_id, $2, TRUE
             FROM unnest($3::bigint[]) AS requested(service_id)
           ON CONFLICT (doctor_id, service_id)
           DO UPDATE SET is_active = TRUE`,
          [req.params.doctorId, req.params.clinicId, serviceIds]
        );
      }

      await writeAudit(client, {
        actorId: req.user.id,
        action: "doctor_services_updated",
        entityId: req.params.doctorId,
        details: { clinic_id: String(req.params.clinicId), service_ids: serviceIds.map(String) },
      });

      const result = await client.query(
        `SELECT s.id, s.name, s.fee, s.duration_minutes
           FROM doctor_services ds
           JOIN services s ON s.id = ds.service_id AND s.clinic_id = ds.clinic_id
          WHERE ds.doctor_id = $1 AND ds.clinic_id = $2
            AND ds.is_active = TRUE AND s.is_active = TRUE
          ORDER BY s.name`,
        [req.params.doctorId, req.params.clinicId]
      );
      return result.rows;
    });

    return res.status(200).json({ success: true, message: "Doctor services updated.", data: { services } });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ success: false, message: error.message });
    return sendDatabaseFailure(error, res, "Unable to update doctor services.");
  }
};

const getDoctorStatistics = async (req, res) => {
  try {
    const [totals, specialties, clinics] = await Promise.all([
      pool.query(
        `SELECT COUNT(*)::int AS total,
                COUNT(*) FILTER (WHERE d.is_active)::int AS active,
                COUNT(*) FILTER (WHERE d.is_available AND d.is_active)::int AS available,
                COUNT(*) FILTER (WHERE NOT d.is_profile_approved)::int AS awaiting_profile_review
           FROM doctors d`
      ),
      pool.query(
        `SELECT specialty, COUNT(*)::int AS total
           FROM doctors WHERE is_active = TRUE
          GROUP BY specialty ORDER BY total DESC, specialty LIMIT 10`
      ),
      pool.query(
        `SELECT c.id AS clinic_id, c.name AS clinic_name, COUNT(d.id)::int AS doctor_count
           FROM clinics c
           LEFT JOIN doctors d ON d.clinic_id = c.id AND d.is_active = TRUE
          GROUP BY c.id, c.name ORDER BY doctor_count DESC, c.name LIMIT 10`
      ),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        totals: totals.rows[0],
        specialties: specialties.rows,
        clinics: clinics.rows,
      },
    });
  } catch (error) {
    return sendDatabaseFailure(error, res, "Unable to load doctor statistics.");
  }
};

const getDoctorAuditLog = async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 20);
  const offset = (page - 1) * limit;

  try {
    const [count, events] = await Promise.all([
      pool.query("SELECT COUNT(*)::int AS total FROM audit_logs WHERE entity = 'doctors'"),
      pool.query(
        `SELECT a.id, a.action, a.entity_id, a.ip_address, a.details, a.created_at,
                u.id AS actor_id, u.full_name AS actor_name, u.role AS actor_role
           FROM audit_logs a
           LEFT JOIN users u ON u.id = a.actor_id
          WHERE a.entity = 'doctors'
          ORDER BY a.created_at DESC, a.id DESC
          LIMIT $1 OFFSET $2`,
        [limit, offset]
      ),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        events: events.rows,
        pagination: {
          page,
          limit,
          total: count.rows[0].total,
          pages: Math.ceil(count.rows[0].total / limit),
        },
      },
    });
  } catch (error) {
    return sendDatabaseFailure(error, res, "Unable to load doctor audit events.");
  }
};

module.exports = {
  getPublicDoctors,
  getPublicDoctorById,
  getClinicDoctorCandidates,
  createDoctorAccountAndProfile,
  createDoctorProfile,
  getClinicDoctors,
  getDoctorById,
  getMyDoctorProfile,
  updateMyDoctorProfile,
  updateDoctorProfile,
  removeDoctorFromClinic,
  resetDoctorPassword,
  getDoctorServices,
  updateDoctorServices,
  getDoctorStatistics,
  getDoctorAuditLog,
};
