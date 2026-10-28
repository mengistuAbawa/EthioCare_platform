const pool = require("../config/db");

const serializeClinic = (clinic) => ({
  id: clinic.id,
  slug: clinic.slug,
  name: clinic.name,
  contact_email: clinic.contact_email,
  contact_phone: clinic.contact_phone,
  city: clinic.city,
  region: clinic.region,
  address: clinic.address,
  verification_status: clinic.verification_status,
  created_by: clinic.created_by,
  created_by_name: clinic.created_by_name || null,
  created_at: clinic.created_at,
  updated_at: clinic.updated_at,
});

const logAuditEvent = async ({ actor_id, action, entity, entity_id, details = {} }) => {
  try {
    await pool.query(
      `INSERT INTO audit_logs (actor_id, action, entity, entity_id, details)
       VALUES ($1, $2, $3, $4, $5::jsonb)`,
      [actor_id ?? null, action, entity, entity_id ? String(entity_id) : null, JSON.stringify(details)]
    );
  } catch (error) {
    console.error("Clinic audit log write failed:", error.message);
  }
};

const hasClinicMembership = async (userId, clinicId) => {
  const result = await pool.query(
    `SELECT id FROM clinic_members
     WHERE clinic_id = $1 AND user_id = $2 AND is_active = TRUE
     LIMIT 1`,
    [clinicId, userId]
  );

  return result.rowCount > 0;
};

const getClinicDetailForUser = async (clinicId, user) => {
  const clinicResult = await pool.query(
    `SELECT c.*, u.full_name AS created_by_name
     FROM clinics c
     LEFT JOIN users u ON u.id = c.created_by
     WHERE c.id = $1`,
    [clinicId]
  );

  if (clinicResult.rowCount === 0) {
    return null;
  }

  const clinic = clinicResult.rows[0];

  if (clinic.verification_status === "verified") {
    return clinic;
  }

  if (!user) {
    return null;
  }

  if (user.role === "system_admin") {
    return clinic;
  }

  const isOwner = Number(clinic.created_by) === Number(user.id);
  const isMember = await hasClinicMembership(user.id, clinicId);

  if (isOwner || isMember) {
    return clinic;
  }

  return null;
};

const listPublicClinics = async (req, res) => {
  try {
    const search = String(req.query.search || "").trim();
    const city = String(req.query.city || "").trim();
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(50, Math.max(1, Number(req.query.limit || 12)));
    const offset = (page - 1) * limit;

    const conditions = ["c.verification_status = 'verified'"];
    const values = [];

    if (search) {
      values.push(`%${search.toLowerCase()}%`);
      conditions.push(`LOWER(COALESCE(c.name, '') || ' ' || COALESCE(c.city, '') || ' ' || COALESCE(c.region, '')) LIKE $${values.length}`);
    }

    if (city) {
      values.push(`%${city.toLowerCase()}%`);
      conditions.push(`LOWER(c.city) LIKE $${values.length}`);
    }

    const filterClause = conditions.join(" AND ");
    const paginatedSql = `
      SELECT c.*, u.full_name AS created_by_name
      FROM clinics c
      LEFT JOIN users u ON u.id = c.created_by
      WHERE ${filterClause}
      ORDER BY c.created_at DESC
      LIMIT $${values.length + 1}
      OFFSET $${values.length + 2}
    `;

    const countSql = `SELECT COUNT(*)::int AS total FROM clinics c WHERE ${filterClause}`;

    const [itemsResult, totalResult] = await Promise.all([
      pool.query(paginatedSql, [...values, limit, offset]),
      pool.query(countSql, values),
    ]);

    const total = totalResult.rows[0]?.total || 0;
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return res.status(200).json({
      success: true,
      data: {
        clinics: itemsResult.rows.map(serializeClinic),
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      },
    });
  } catch (error) {
    console.error("List public clinics error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to load clinics.",
    });
  }
};

const getClinic = async (req, res) => {
  try {
    const clinicId = Number(req.params.id);

    if (!clinicId || Number.isNaN(clinicId)) {
      return res.status(400).json({
        success: false,
        message: "A valid clinic ID is required.",
      });
    }

    const clinic = await getClinicDetailForUser(clinicId, req.user);

    if (!clinic) {
      return res.status(404).json({
        success: false,
        message: "Clinic not found or not available to view.",
      });
    }

    const servicesResult = await pool.query(
      `SELECT * FROM services
       WHERE clinic_id = $1 AND is_active = TRUE
       ORDER BY name ASC`,
      [clinicId]
    );

    return res.status(200).json({
      success: true,
      data: {
        clinic: {
          ...serializeClinic(clinic),
          services: servicesResult.rows,
        },
      },
    });
  } catch (error) {
    console.error("Get clinic error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to load the clinic.",
    });
  }
};

const createClinic = async (req, res) => {
  try {
    const { slug, name, contact_email, contact_phone, city, region, address } = req.body;
    const normalizedSlug = String(slug || "").trim().toLowerCase();

    if (!normalizedSlug || !name || !city || !address) {
      return res.status(400).json({
        success: false,
        message: "Clinic slug, name, city, and address are required.",
      });
    }

    const existingClinic = await pool.query(
      `SELECT id FROM clinics WHERE LOWER(slug) = LOWER($1) LIMIT 1`,
      [normalizedSlug]
    );

    if (existingClinic.rowCount > 0) {
      return res.status(409).json({
        success: false,
        message: "A clinic with this slug already exists.",
      });
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const userRoleUpdateNeeded = !["system_admin", "clinic_admin"].includes(req.user.role);

      if (userRoleUpdateNeeded) {
        await client.query(
          `UPDATE users
           SET role = 'clinic_admin', updated_at = now()
           WHERE id = $1`,
          [req.user.id]
        );
      }

      const clinicResult = await client.query(
        `INSERT INTO clinics (slug, name, contact_email, contact_phone, city, region, address, verification_status, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $8)
         RETURNING *`,
        [
          normalizedSlug,
          String(name).trim(),
          contact_email ? String(contact_email).trim() : null,
          contact_phone ? String(contact_phone).trim() : null,
          String(city).trim(),
          region ? String(region).trim() : null,
          String(address).trim(),
          req.user.id,
        ]
      );

      const clinic = clinicResult.rows[0];

      await client.query(
        `INSERT INTO clinic_members (clinic_id, user_id, role, is_active)
         VALUES ($1, $2, 'clinic_admin', TRUE)
         ON CONFLICT (clinic_id, user_id)
         DO UPDATE SET role = EXCLUDED.role, is_active = TRUE, updated_at = now()`,
        [clinic.id, req.user.id]
      );

      await client.query("COMMIT");

      await logAuditEvent({
        actor_id: req.user.id,
        action: "clinic_created",
        entity: "clinics",
        entity_id: clinic.id,
        details: {
          slug: clinic.slug,
          verification_status: clinic.verification_status,
        },
      });

      return res.status(201).json({
        success: true,
        message: "Clinic registration submitted successfully. It is now pending verification.",
        data: {
          clinic: serializeClinic(clinic),
        },
      });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Create clinic error:", error.message);

    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "A clinic with the submitted information already exists.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to register the clinic.",
    });
  }
};

const updateClinic = async (req, res) => {
  try {
    const clinicId = Number(req.params.id);
    const allowedFields = ["name", "contact_email", "contact_phone", "city", "region", "address"];
    const updateValues = {};

    allowedFields.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        const value = req.body[field];
        updateValues[field] = value === null || value === "" ? null : String(value).trim();
      }
    });

    if (Object.keys(updateValues).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid clinic fields were provided.",
      });
    }

    const assignments = Object.entries(updateValues)
      .map(([field], index) => `${field} = $${index + 1}`)
      .join(", ");

    const values = Object.values(updateValues);
    values.push(clinicId);

    const updateQuery = `UPDATE clinics SET ${assignments}, updated_at = now() WHERE id = $${values.length} RETURNING *`;
    const result = await pool.query(updateQuery, values);

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Clinic not found.",
      });
    }

    await logAuditEvent({
      actor_id: req.user.id,
      action: "clinic_updated",
      entity: "clinics",
      entity_id: clinicId,
      details: {
        updated_fields: Object.keys(updateValues),
      },
    });

    return res.status(200).json({
      success: true,
      message: "Clinic details updated successfully.",
      data: {
        clinic: serializeClinic(result.rows[0]),
      },
    });
  } catch (error) {
    console.error("Update clinic error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to update clinic details.",
    });
  }
};

const listMyClinics = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT DISTINCT c.*, u.full_name AS created_by_name
       FROM clinics c
       LEFT JOIN users u ON u.id = c.created_by
       LEFT JOIN clinic_members cm ON cm.clinic_id = c.id AND cm.is_active = TRUE
       WHERE c.created_by = $1 OR cm.user_id = $1
       ORDER BY c.created_at DESC`,
      [req.user.id]
    );

    return res.status(200).json({
      success: true,
      data: {
        clinics: result.rows.map(serializeClinic),
      },
    });
  } catch (error) {
    console.error("List my clinics error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to load your clinics.",
    });
  }
};

const listClinicsForReview = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*, u.full_name AS created_by_name
       FROM clinics c
       LEFT JOIN users u ON u.id = c.created_by
       ORDER BY c.created_at DESC`
    );

    return res.status(200).json({
      success: true,
      data: {
        clinics: result.rows.map(serializeClinic),
      },
    });
  } catch (error) {
    console.error("List clinics for review error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to load clinics for review.",
    });
  }
};

const reviewClinic = async (req, res) => {
  try {
    const clinicId = Number(req.params.id);
    const { decision, reason } = req.body;
    const nextStatus = String(decision || "").trim().toLowerCase();

    if (!clinicId || Number.isNaN(clinicId)) {
      return res.status(400).json({
        success: false,
        message: "A valid clinic ID is required.",
      });
    }

    if (!['verified', 'rejected'].includes(nextStatus)) {
      return res.status(400).json({
        success: false,
        message: "Decision must be either verified or rejected.",
      });
    }

    if (nextStatus === "rejected" && (!reason || String(reason).trim().length < 5)) {
      return res.status(400).json({
        success: false,
        message: "A rejection reason of at least 5 characters is required.",
      });
    }

    const result = await pool.query(
      `UPDATE clinics
       SET verification_status = $1, updated_at = now()
       WHERE id = $2
       RETURNING *`,
      [nextStatus, clinicId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Clinic not found.",
      });
    }

    await logAuditEvent({
      actor_id: req.user.id,
      action: nextStatus === "verified" ? "clinic_verified" : "clinic_rejected",
      entity: "clinics",
      entity_id: clinicId,
      details: {
        decision: nextStatus,
        reason: nextStatus === "rejected" ? String(reason).trim() : null,
      },
    });

    return res.status(200).json({
      success: true,
      message: `Clinic ${nextStatus} successfully.`,
      data: {
        clinic: serializeClinic(result.rows[0]),
      },
    });
  } catch (error) {
    console.error("Review clinic error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to update the clinic verification status.",
    });
  }
};

module.exports = {
  listPublicClinics,
  getClinic,
  createClinic,
  updateClinic,
  listMyClinics,
  listClinicsForReview,
  reviewClinic,
};
