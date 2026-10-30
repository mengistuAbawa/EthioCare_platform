const pool = require("../config/db");
const bcrypt = require("bcryptjs");

const getPagination = (query) => {
  const page = Number(query.page || 1);
  const limit = Number(query.limit || 20);
  return { page, limit, offset: (page - 1) * limit };
};

const sendDatabaseFailure = (error, res, message) => {
  console.error("System admin request failed:", error.message);
  return res.status(500).json({ success: false, message });
};

const writeAuditLog = async (client, { actorId, action, entity, entityId, details, ipAddress }) => {
  await client.query(
    `INSERT INTO audit_logs (actor_id, action, entity, entity_id, ip_address, details)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb)`,
    [actorId, action, entity, String(entityId), ipAddress || null, JSON.stringify(details || {})]
  );
};

const getDashboardSummary = async (req, res) => {
  try {
    const [
      clinicCounts,
      userCounts,
      appointmentCounts,
      appointmentStatuses,
      activity,
      recentClinics,
      clinicTrend,
      appointmentTrend,
    ] =
      await Promise.all([
        pool.query(
          `SELECT COUNT(*)::int AS total,
                  COUNT(*) FILTER (WHERE verification_status = 'pending')::int AS pending,
                  COUNT(*) FILTER (WHERE verification_status = 'verified')::int AS verified,
                  COUNT(*) FILTER (WHERE verification_status = 'rejected')::int AS rejected,
                  COUNT(*) FILTER (WHERE operational_status = 'suspended')::int AS suspended
             FROM clinics`
        ),
        pool.query(
          `SELECT COUNT(*)::int AS total,
                  COUNT(*) FILTER (WHERE role = 'doctor')::int AS doctors,
                  COUNT(*) FILTER (WHERE role = 'receptionist')::int AS receptionists,
                  COUNT(*) FILTER (WHERE role = 'patient')::int AS patients,
                  COUNT(*) FILTER (WHERE role = 'clinic_admin')::int AS clinic_admins
             FROM users
            WHERE is_active = TRUE`
        ),
        pool.query("SELECT COUNT(*)::int AS total FROM appointments"),
        pool.query(
          `SELECT status, COUNT(*)::int AS count
             FROM appointments
            GROUP BY status
            ORDER BY status`
        ),
        pool.query(
          `SELECT a.id, a.action, a.entity, a.entity_id, a.details, a.created_at,
                  u.id AS actor_id, u.full_name AS actor_name, u.role AS actor_role
             FROM audit_logs a
             LEFT JOIN users u ON u.id = a.actor_id
            ORDER BY a.created_at DESC, a.id DESC
            LIMIT 8`
        ),
        pool.query(
          `SELECT c.id, c.name, c.city, c.region, c.verification_status,
                  c.operational_status, c.created_at, u.full_name AS created_by_name
             FROM clinics c
             LEFT JOIN users u ON u.id = c.created_by
            ORDER BY c.created_at DESC, c.id DESC
            LIMIT 8`
        ),
        pool.query(
          `WITH days AS (
             SELECT generate_series(CURRENT_DATE - 13, CURRENT_DATE, interval '1 day')::date AS day
           )
           SELECT days.day, COUNT(c.id)::int AS count
             FROM days
             LEFT JOIN clinics c
               ON c.created_at >= days.day
              AND c.created_at < days.day + interval '1 day'
            GROUP BY days.day
            ORDER BY days.day`
        ),
        pool.query(
          `WITH days AS (
             SELECT generate_series(CURRENT_DATE - 13, CURRENT_DATE, interval '1 day')::date AS day
           )
           SELECT days.day, COUNT(a.id)::int AS count
             FROM days
             LEFT JOIN appointments a
               ON a.created_at >= days.day
              AND a.created_at < days.day + interval '1 day'
            GROUP BY days.day
            ORDER BY days.day`
        ),
      ]);

    return res.status(200).json({
      success: true,
      data: {
        clinics: clinicCounts.rows[0],
        users: userCounts.rows[0],
        appointments: {
          total: appointmentCounts.rows[0].total,
          by_status: appointmentStatuses.rows,
        },
        recent_activity: activity.rows,
        recent_clinics: recentClinics.rows,
        trends: {
          clinic_registrations: clinicTrend.rows,
          appointments_created: appointmentTrend.rows,
        },
      },
    });
  } catch (error) {
    return sendDatabaseFailure(error, res, "Unable to load platform dashboard metrics.");
  }
};

const listClinics = async (req, res) => {
  const { page, limit, offset } = getPagination(req.query);
  const filters = [];
  const values = [];
  const addFilter = (sql, value) => {
    values.push(value);
    filters.push(sql.replace("?", `$${values.length}`));
  };

  if (req.query.search) {
    const search = `%${req.query.search}%`;
    values.push(search, search, search, search);
    const position = values.length - 3;
    filters.push(
      `(c.name ILIKE $${position} OR c.slug ILIKE $${position + 1} OR c.city ILIKE $${position + 2} OR c.contact_email ILIKE $${position + 3})`
    );
  }
  if (req.query.verification_status) addFilter("c.verification_status = ?", req.query.verification_status);
  if (req.query.operational_status) addFilter("c.operational_status = ?", req.query.operational_status);
  const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

  try {
    const [count, rows] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int AS total FROM clinics c ${whereClause}`, values),
      pool.query(
        `SELECT c.id, c.slug, c.name, c.city, c.region, c.contact_email, c.contact_phone,
                c.verification_status, c.operational_status, c.created_at, c.updated_at,
                u.full_name AS created_by_name
           FROM clinics c
           LEFT JOIN users u ON u.id = c.created_by
           ${whereClause}
          ORDER BY c.created_at DESC, c.id DESC
          LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
        [...values, limit, offset]
      ),
    ]);
    const total = count.rows[0].total;
    return res.status(200).json({
      success: true,
      data: { clinics: rows.rows, pagination: { page, limit, total, pages: Math.ceil(total / limit) } },
    });
  } catch (error) {
    return sendDatabaseFailure(error, res, "Unable to load clinics.");
  }
};

const getClinic = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.id, c.slug, c.name, c.contact_email, c.contact_phone, c.city, c.region, c.address,
              c.verification_status, c.operational_status, c.rejection_reason, c.reviewed_at,
              c.suspension_reason, c.suspended_at, c.created_at, c.updated_at,
              owner.id AS created_by, owner.full_name AS created_by_name,
              reviewer.full_name AS reviewed_by_name, suspender.full_name AS suspended_by_name
         FROM clinics c
         LEFT JOIN users owner ON owner.id = c.created_by
         LEFT JOIN users reviewer ON reviewer.id = c.reviewed_by
         LEFT JOIN users suspender ON suspender.id = c.suspended_by
        WHERE c.id = $1`,
      [req.params.clinicId]
    );
    if (!result.rowCount) return res.status(404).json({ success: false, message: "Clinic not found." });
    return res.status(200).json({ success: true, data: { clinic: result.rows[0] } });
  } catch (error) {
    return sendDatabaseFailure(error, res, "Unable to load clinic details.");
  }
};

const updateClinic = async (req, res) => {
  const allowedFields = ["name", "contact_email", "contact_phone", "city", "region", "address"];
  const fields = allowedFields.filter((field) => Object.hasOwn(req.body, field));
  const values = fields.map((field) => req.body[field] === "" ? null : req.body[field]);
  const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(", ");

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      `UPDATE clinics SET ${setClause}, updated_at = now()
        WHERE id = $${values.length + 1}
        RETURNING id, slug, name, contact_email, contact_phone, city, region, address,
                  verification_status, operational_status, created_at, updated_at`,
      [...values, req.params.clinicId]
    );
    if (!result.rowCount) {
      await client.query("ROLLBACK");
      return res.status(404).json({ success: false, message: "Clinic not found." });
    }
    await writeAuditLog(client, {
      actorId: req.user.id,
      action: "clinic_profile_updated",
      entity: "clinics",
      entityId: req.params.clinicId,
      details: { updated_fields: fields },
      ipAddress: req.ip,
    });
    await client.query("COMMIT");
    return res.status(200).json({ success: true, message: "Clinic details updated.", data: { clinic: result.rows[0] } });
  } catch (error) {
    await client.query("ROLLBACK");
    return sendDatabaseFailure(error, res, "Unable to update clinic details.");
  } finally {
    client.release();
  }
};

const reviewClinic = async (req, res) => {
  const { decision, reason } = req.body;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      `UPDATE clinics
          SET verification_status = $1,
              rejection_reason = CASE WHEN $1 = 'rejected' THEN $2 ELSE NULL END,
              reviewed_by = $3,
              reviewed_at = now(),
              updated_at = now()
        WHERE id = $4 AND verification_status = 'pending'
        RETURNING id, name, verification_status, rejection_reason, reviewed_by, reviewed_at`,
      [decision, decision === "rejected" ? reason.trim() : null, req.user.id, req.params.clinicId]
    );
    if (!result.rowCount) {
      const exists = await client.query("SELECT id FROM clinics WHERE id = $1", [req.params.clinicId]);
      await client.query("ROLLBACK");
      return exists.rowCount
        ? res.status(409).json({ success: false, message: "Only pending clinic applications can be reviewed." })
        : res.status(404).json({ success: false, message: "Clinic not found." });
    }
    await writeAuditLog(client, {
      actorId: req.user.id,
      action: decision === "verified" ? "clinic_verified" : "clinic_rejected",
      entity: "clinics",
      entityId: req.params.clinicId,
      details: { decision, reason: decision === "rejected" ? reason.trim() : null },
      ipAddress: req.ip,
    });
    await client.query("COMMIT");
    return res.status(200).json({
      success: true,
      message: `Clinic ${decision} successfully.`,
      data: { clinic: result.rows[0] },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    return sendDatabaseFailure(error, res, "Unable to update clinic verification status.");
  } finally {
    client.release();
  }
};

const updateClinicStatus = async (req, res) => {
  const { status, reason } = req.body;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      `UPDATE clinics
          SET operational_status = $1,
              suspension_reason = CASE WHEN $1 = 'suspended' THEN $2 ELSE NULL END,
              suspended_by = CASE WHEN $1 = 'suspended' THEN $3 ELSE NULL END,
              suspended_at = CASE WHEN $1 = 'suspended' THEN now() ELSE NULL END,
              updated_at = now()
        WHERE id = $4 AND operational_status <> $1
        RETURNING id, name, operational_status, suspension_reason, suspended_by, suspended_at`,
      [status, reason.trim(), req.user.id, req.params.clinicId]
    );
    if (!result.rowCount) {
      const exists = await client.query("SELECT operational_status FROM clinics WHERE id = $1", [req.params.clinicId]);
      await client.query("ROLLBACK");
      return exists.rowCount
        ? res.status(409).json({ success: false, message: `Clinic is already ${status}.` })
        : res.status(404).json({ success: false, message: "Clinic not found." });
    }
    await writeAuditLog(client, {
      actorId: req.user.id,
      action: status === "suspended" ? "clinic_suspended" : "clinic_reactivated",
      entity: "clinics",
      entityId: req.params.clinicId,
      details: { status, reason: reason.trim() },
      ipAddress: req.ip,
    });
    await client.query("COMMIT");
    return res.status(200).json({
      success: true,
      message: `Clinic ${status} successfully.`,
      data: { clinic: result.rows[0] },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    return sendDatabaseFailure(error, res, "Unable to update clinic status.");
  } finally {
    client.release();
  }
};

const listUsers = async (req, res) => {
  const { page, limit, offset } = getPagination(req.query);
  const filters = [];
  const values = [];
  const addFilter = (sql, value) => {
    values.push(value);
    filters.push(sql.replace("?", `$${values.length}`));
  };
  if (req.query.search) {
    values.push(`%${req.query.search}%`);
    filters.push(`(u.full_name ILIKE $${values.length} OR u.email ILIKE $${values.length})`);
  }
  if (req.query.role) addFilter("u.role = ?", req.query.role);
  if (req.query.roles) {
    const roles = req.query.roles.split(",");
    values.push(roles);
    filters.push(`u.role = ANY($${values.length}::text[])`);
  }
  if (req.query.status) addFilter("u.is_active = ?", req.query.status === "active");
  const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

  try {
    const [count, rows] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int AS total FROM users u ${whereClause}`, values),
      pool.query(
        `SELECT u.id, u.full_name, u.email, u.phone, u.role, u.is_active, u.is_verified, u.created_at,
                d.specialty, d.is_active AS doctor_active, c.name AS clinic_name
           FROM users u
           LEFT JOIN doctors d ON d.user_id = u.id
           LEFT JOIN clinics c ON c.id = d.clinic_id
           ${whereClause}
          ORDER BY u.created_at DESC, u.id DESC
          LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
        [...values, limit, offset]
      ),
    ]);
    const total = count.rows[0].total;
    return res.status(200).json({
      success: true,
      data: { users: rows.rows, pagination: { page, limit, total, pages: Math.ceil(total / limit) } },
    });
  } catch (error) {
    return sendDatabaseFailure(error, res, "Unable to load platform users.");
  }
};

const createManagedUser = async (req, res) => {
  const { full_name: fullName, email, phone, password, role } = req.body;
  const clinicId = ["clinic_admin", "receptionist"].includes(role)
    ? Number(req.body.clinic_id)
    : null;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    if (clinicId) {
      const clinic = await client.query("SELECT id FROM clinics WHERE id = $1 FOR SHARE", [clinicId]);
      if (!clinic.rowCount) {
        await client.query("ROLLBACK");
        return res.status(404).json({ success: false, message: "Selected clinic was not found." });
      }
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const userResult = await client.query(
      `INSERT INTO users (full_name, email, password_hash, phone, role, is_active, is_verified)
       VALUES ($1, $2, $3, $4, $5, TRUE, TRUE)
       RETURNING id, full_name, email, phone, role, is_active, is_verified, created_at`,
      [fullName.trim(), email.trim().toLowerCase(), passwordHash, phone?.trim() || null, role]
    );
    const user = userResult.rows[0];

    if (clinicId) {
      await client.query(
        `INSERT INTO clinic_members (clinic_id, user_id, role, is_active)
         VALUES ($1, $2, $3, TRUE)`,
        [clinicId, user.id, role]
      );
    }

    await writeAuditLog(client, {
      actorId: req.user.id,
      action: "admin_user_created",
      entity: "users",
      entityId: user.id,
      ipAddress: req.ip,
      details: { role, clinic_id: clinicId },
    });

    await client.query("COMMIT");
    return res.status(201).json({
      success: true,
      message: role === "doctor"
        ? "Doctor account created. Assign it to a verified clinic to create its doctor profile."
        : role === "receptionist"
          ? "Receptionist account created and assigned to the selected clinic."
          : "Clinic administrator account created and assigned to the selected clinic.",
      data: { user },
    });
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error("Create managed user rollback failed:", rollbackError.message);
    }
    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "An account with this email address already exists.",
      });
    }
    return sendDatabaseFailure(error, res, "Unable to create the account.");
  } finally {
    client.release();
  }
};

const listAppointments = async (req, res) => {
  const { page, limit, offset } = getPagination(req.query);
  const filters = [];
  const values = [];
  const addFilter = (sql, value) => {
    values.push(value);
    filters.push(sql.replace("?", `$${values.length}`));
  };
  if (req.query.status) addFilter("a.status = ?", req.query.status);
  if (req.query.clinic_id) addFilter("a.clinic_id = ?", req.query.clinic_id);
  if (req.query.doctor_id) addFilter("a.doctor_id = ?", req.query.doctor_id);
  if (req.query.from) addFilter("a.starts_at >= ?", req.query.from);
  if (req.query.to) addFilter("a.starts_at < ?", new Date(new Date(req.query.to).getTime() + 86400000));
  const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

  try {
    const [count, rows] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int AS total FROM appointments a ${whereClause}`, values),
      pool.query(
        `SELECT a.id, a.patient_id, a.status, a.starts_at, a.ends_at, a.created_at,
                c.id AS clinic_id, c.name AS clinic_name,
                d.id AS doctor_id, du.full_name AS doctor_name, d.specialty,
                s.id AS service_id, s.name AS service_name
           FROM appointments a
           JOIN clinics c ON c.id = a.clinic_id
           JOIN doctors d ON d.id = a.doctor_id
           JOIN users du ON du.id = d.user_id
           JOIN services s ON s.id = a.service_id
           ${whereClause}
          ORDER BY a.starts_at DESC, a.id DESC
          LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
        [...values, limit, offset]
      ),
    ]);
    const total = count.rows[0].total;
    return res.status(200).json({
      success: true,
      data: { appointments: rows.rows, pagination: { page, limit, total, pages: Math.ceil(total / limit) } },
    });
  } catch (error) {
    return sendDatabaseFailure(error, res, "Unable to load appointments.");
  }
};

const listAuditLogs = async (req, res) => {
  const { page, limit, offset } = getPagination(req.query);
  const filters = [];
  const values = [];
  const addFilter = (sql, value) => {
    values.push(value);
    filters.push(sql.replace("?", `$${values.length}`));
  };
  if (req.query.actor_id) addFilter("a.actor_id = ?", req.query.actor_id);
  if (req.query.action) addFilter("a.action ILIKE ?", `%${req.query.action}%`);
  if (req.query.entity) addFilter("a.entity = ?", req.query.entity);
  if (req.query.from) addFilter("a.created_at >= ?", req.query.from);
  if (req.query.to) addFilter("a.created_at < ?", new Date(new Date(req.query.to).getTime() + 86400000));
  const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

  try {
    const [count, rows] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int AS total FROM audit_logs a ${whereClause}`, values),
      pool.query(
        `SELECT a.id, a.action, a.entity, a.entity_id, a.ip_address, a.details, a.created_at,
                u.id AS actor_id, u.full_name AS actor_name, u.role AS actor_role
           FROM audit_logs a
           LEFT JOIN users u ON u.id = a.actor_id
           ${whereClause}
          ORDER BY a.created_at DESC, a.id DESC
          LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
        [...values, limit, offset]
      ),
    ]);
    const total = count.rows[0].total;
    return res.status(200).json({
      success: true,
      data: { events: rows.rows, pagination: { page, limit, total, pages: Math.ceil(total / limit) } },
    });
  } catch (error) {
    return sendDatabaseFailure(error, res, "Unable to load audit history.");
  }
};

const listNotifications = async (req, res) => {
  const { page, limit, offset } = getPagination(req.query);
  try {
    const [count, rows] = await Promise.all([
      pool.query(
        "SELECT COUNT(*)::int AS total FROM notifications WHERE recipient_id = $1",
        [req.user.id]
      ),
      pool.query(
        `SELECT id, title, message, type, is_read, created_at
           FROM notifications
          WHERE recipient_id = $1
          ORDER BY created_at DESC, id DESC
          LIMIT $2 OFFSET $3`,
        [req.user.id, limit, offset]
      ),
    ]);
    const total = count.rows[0].total;
    return res.status(200).json({
      success: true,
      data: { notifications: rows.rows, pagination: { page, limit, total, pages: Math.ceil(total / limit) } },
    });
  } catch (error) {
    return sendDatabaseFailure(error, res, "Unable to load your notifications.");
  }
};

const markNotificationRead = async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE notifications
          SET is_read = TRUE
        WHERE id = $1 AND recipient_id = $2
        RETURNING id, is_read`,
      [req.params.notificationId, req.user.id]
    );
    if (!result.rowCount) {
      return res.status(404).json({ success: false, message: "Notification not found." });
    }
    return res.status(200).json({ success: true, data: { notification: result.rows[0] } });
  } catch (error) {
    return sendDatabaseFailure(error, res, "Unable to update notification status.");
  }
};

module.exports = {
  getDashboardSummary,
  listClinics,
  getClinic,
  updateClinic,
  reviewClinic,
  updateClinicStatus,
  listUsers,
  createManagedUser,
  listAppointments,
  listAuditLogs,
  listNotifications,
  markNotificationRead,
};
