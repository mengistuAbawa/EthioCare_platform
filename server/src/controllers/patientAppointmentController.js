const pool = require("../config/db");

const listMyAppointments = async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 20);
  const offset = (page - 1) * limit;
  const filters = ["a.patient_id = $1"];
  const values = [req.user.id];

  if (req.query.status) {
    values.push(req.query.status);
    filters.push(`a.status = $${values.length}`);
  }
  if (req.query.period === "upcoming") {
    filters.push("a.starts_at >= now() AND a.status IN ('pending', 'confirmed')");
  } else if (req.query.period === "history") {
    filters.push("(a.starts_at < now() OR a.status IN ('completed', 'cancelled', 'rejected', 'no_show'))");
  }

  const whereClause = filters.join(" AND ");

  try {
    const [count, rows] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int AS total FROM appointments a WHERE ${whereClause}`, values),
      pool.query(
        `SELECT a.id, a.status, a.starts_at, a.ends_at, a.reason, a.cancellation_reason, a.created_at,
                c.id AS clinic_id, c.name AS clinic_name, c.city, c.region,
                d.id AS doctor_id, du.full_name AS doctor_name, d.specialty,
                s.id AS service_id, s.name AS service_name, s.fee, s.duration_minutes
           FROM appointments a
           JOIN clinics c ON c.id = a.clinic_id
           JOIN doctors d ON d.id = a.doctor_id
           JOIN users du ON du.id = d.user_id
           JOIN services s ON s.id = a.service_id
          WHERE ${whereClause}
          ORDER BY a.starts_at ${req.query.period === "history" ? "DESC" : "ASC"}, a.id DESC
          LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
        [...values, limit, offset]
      ),
    ]);

    const total = count.rows[0].total;
    return res.status(200).json({
      success: true,
      data: {
        appointments: rows.rows,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    console.error("Patient appointment list error:", error.message);
    return res.status(500).json({ success: false, message: "Unable to load your appointments." });
  }
};

module.exports = { listMyAppointments };
