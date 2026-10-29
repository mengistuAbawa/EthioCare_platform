const pool = require("../config/db");

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DEFAULT_TIME_ZONE = "Africa/Addis_Ababa";

const isValidDate = (value) => {
  if (typeof value !== "string" || !DATE_PATTERN.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
};

const getDateRange = (req, res) => {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: DEFAULT_TIME_ZONE }).format(new Date());
  const from = req.query.from || today;
  const to = req.query.to || from;
  if (!isValidDate(from) || !isValidDate(to) || from > to) {
    res.status(400).json({ success: false, message: "Use valid from/to dates in YYYY-MM-DD format." });
    return null;
  }
  const days = (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000;
  if (days > 90) {
    res.status(400).json({ success: false, message: "Date ranges cannot exceed 90 days." });
    return null;
  }
  return { from, to };
};

const getDoctorProfile = async (userId) => {
  const result = await pool.query(
    `SELECT d.id, d.clinic_id
       FROM doctors d
       JOIN clinics c ON c.id = d.clinic_id
        AND c.verification_status = 'verified'
        AND c.operational_status = 'active'
      WHERE d.user_id = $1
        AND d.is_active = TRUE
        AND d.is_profile_approved = TRUE`,
    [userId]
  );
  return result.rows[0] || null;
};

const sendDatabaseError = (error, res, message, label) => {
  console.error(`${label}:`, error.message);
  return res.status(500).json({ success: false, message });
};

const appointmentSelect = `
  SELECT a.id, a.status, a.starts_at, a.ends_at, a.reason,
         p.id AS patient_id, p.full_name AS patient_name, p.phone AS patient_phone,
         s.id AS service_id, s.name AS service_name, c.id AS clinic_id, c.name AS clinic_name
    FROM appointments a
    JOIN users p ON p.id = a.patient_id AND p.role = 'patient'
    JOIN services s ON s.id = a.service_id AND s.clinic_id = a.clinic_id
    JOIN clinics c ON c.id = a.clinic_id`;

const getDashboard = async (req, res) => {
  const range = getDateRange(req, res);
  if (!range) return;
  try {
    const doctor = await getDoctorProfile(req.user.id);
    if (!doctor) return res.status(404).json({ success: false, message: "Doctor profile not found." });

    const [stats, appointments, assessments, unread] = await Promise.all([
      pool.query(
        `SELECT COUNT(*) FILTER (
                  WHERE starts_at >= ($2::date::timestamp AT TIME ZONE $3)
                    AND starts_at < (($2::date + 1)::timestamp AT TIME ZONE $3)
                )::int AS today_appointments,
                COUNT(*) FILTER (
                  WHERE starts_at >= ($2::date::timestamp AT TIME ZONE $3)
                    AND starts_at < (($2::date + 1)::timestamp AT TIME ZONE $3)
                    AND status = 'completed'
                )::int AS completed_appointments,
                (SELECT COUNT(*)::int
                   FROM appointments upcoming
                  WHERE upcoming.doctor_id = $1
                    AND upcoming.starts_at >= (($2::date + 1)::timestamp AT TIME ZONE $3)
                    AND upcoming.starts_at < (($2::date + 91)::timestamp AT TIME ZONE $3)
                    AND upcoming.status IN ('pending', 'confirmed')) AS upcoming_appointments
           FROM appointments
          WHERE doctor_id = $1
            AND starts_at >= ($2::date::timestamp AT TIME ZONE $3)
            AND starts_at < (($2::date + 1)::timestamp AT TIME ZONE $3)`,
        [doctor.id, range.from, DEFAULT_TIME_ZONE]
      ),
      pool.query(
        `${appointmentSelect}
          WHERE a.doctor_id = $1
            AND a.starts_at >= ($2::date::timestamp AT TIME ZONE $3)
            AND a.starts_at < (($2::date + 1)::timestamp AT TIME ZONE $3)
          ORDER BY a.starts_at, a.id`,
        [doctor.id, range.from, DEFAULT_TIME_ZONE]
      ),
      pool.query(
        `SELECT COUNT(*)::int AS pending_assessments
           FROM patient_health_assessments
          WHERE doctor_id = $1 AND status IN ('submitted', 'in_review')`,
        [doctor.id]
      ),
      pool.query(
        `SELECT COUNT(*)::int AS unread_notifications
           FROM notifications n
          WHERE n.recipient_id = $1 AND n.is_read = FALSE
            AND (n.appointment_id IS NULL OR EXISTS (
              SELECT 1 FROM appointments a
               WHERE a.id = n.appointment_id AND a.doctor_id = $2
            ))`,
        [req.user.id, doctor.id]
      ),
    ]);

    return res.json({
      success: true,
      data: {
        date: range.from,
        stats: { ...stats.rows[0], ...assessments.rows[0], ...unread.rows[0] },
        appointments: appointments.rows,
        unsupported_metrics: ["waiting_patients", "lab_results_awaiting_review", "follow_ups_due"],
      },
    });
  } catch (error) {
    return sendDatabaseError(error, res, "Unable to load the doctor dashboard.", "Doctor dashboard error");
  }
};

const listAppointments = async (req, res) => {
  const range = getDateRange(req, res);
  if (!range) return;
  const statuses = ["pending", "confirmed", "completed", "cancelled", "rejected", "no_show"];
  const status = String(req.query.status || "");
  if (status && !statuses.includes(status)) {
    return res.status(400).json({ success: false, message: "Invalid appointment status." });
  }
  try {
    const doctor = await getDoctorProfile(req.user.id);
    if (!doctor) return res.status(404).json({ success: false, message: "Doctor profile not found." });
    const values = [doctor.id, range.from, range.to, DEFAULT_TIME_ZONE];
    const statusFilter = status ? ` AND a.status = $${values.push(status)}` : "";
    const result = await pool.query(
      `${appointmentSelect}
        WHERE a.doctor_id = $1
          AND a.starts_at >= ($2::date::timestamp AT TIME ZONE $4)
          AND a.starts_at < (($3::date + 1)::timestamp AT TIME ZONE $4)${statusFilter}
        ORDER BY a.starts_at, a.id`,
      values
    );
    return res.json({ success: true, data: { appointments: result.rows, range } });
  } catch (error) {
    return sendDatabaseError(error, res, "Unable to load your appointments.", "Doctor appointment list error");
  }
};

const getSchedule = async (req, res) => {
  const range = getDateRange(req, res);
  if (!range) return;
  try {
    const doctor = await getDoctorProfile(req.user.id);
    if (!doctor) return res.status(404).json({ success: false, message: "Doctor profile not found." });
    const [hours, timeOff, appointments] = await Promise.all([
      pool.query(
        `SELECT day_of_week, to_char(start_time, 'HH24:MI') AS start_time,
                to_char(end_time, 'HH24:MI') AS end_time
           FROM working_hours WHERE doctor_id = $1 AND is_available = TRUE
          ORDER BY day_of_week`,
        [doctor.id]
      ),
      pool.query(
        `SELECT starts_at, ends_at
           FROM time_off
          WHERE doctor_id = $1
            AND ends_at > ($2::date::timestamp AT TIME ZONE $4)
            AND starts_at < (($3::date + 1)::timestamp AT TIME ZONE $4)
          ORDER BY starts_at`,
        [doctor.id, range.from, range.to, DEFAULT_TIME_ZONE]
      ),
      pool.query(
        `${appointmentSelect}
          WHERE a.doctor_id = $1
            AND a.starts_at >= ($2::date::timestamp AT TIME ZONE $4)
            AND a.starts_at < (($3::date + 1)::timestamp AT TIME ZONE $4)
          ORDER BY a.starts_at, a.id`,
        [doctor.id, range.from, range.to, DEFAULT_TIME_ZONE]
      ),
    ]);
    return res.json({
      success: true,
      data: { working_hours: hours.rows, time_off: timeOff.rows, appointments: appointments.rows, range, editable: false },
    });
  } catch (error) {
    return sendDatabaseError(error, res, "Unable to load your schedule.", "Doctor schedule error");
  }
};

const listPatients = async (req, res) => {
  const search = String(req.query.search || "").trim().slice(0, 100);
  const page = Math.max(1, Math.min(100000, Number(req.query.page) || 1));
  const limit = Math.max(1, Math.min(50, Number(req.query.limit) || 20));
  const offset = (page - 1) * limit;
  try {
    const doctor = await getDoctorProfile(req.user.id);
    if (!doctor) return res.status(404).json({ success: false, message: "Doctor profile not found." });
    const condition = `a.doctor_id = $1
       AND ($2 = '' OR p.full_name ILIKE '%' || $2 || '%' OR p.email ILIKE '%' || $2 || '%' OR COALESCE(p.phone, '') ILIKE '%' || $2 || '%')`;
    const [total, patients] = await Promise.all([
      pool.query(
        `SELECT COUNT(DISTINCT p.id)::int AS total
           FROM appointments a JOIN users p ON p.id = a.patient_id AND p.role = 'patient'
          WHERE ${condition}`,
        [doctor.id, search]
      ),
      pool.query(
        `SELECT p.id, p.full_name, p.email, p.phone,
                COUNT(a.id)::int AS appointment_count,
                MAX(a.starts_at) AS last_appointment_at
           FROM appointments a JOIN users p ON p.id = a.patient_id AND p.role = 'patient'
          WHERE ${condition}
          GROUP BY p.id, p.full_name, p.email, p.phone
          ORDER BY p.full_name, p.id
          LIMIT $3 OFFSET $4`,
        [doctor.id, search, limit, offset]
      ),
    ]);
    return res.json({
      success: true,
      data: {
        patients: patients.rows,
        pagination: { page, limit, total: total.rows[0].total, pages: Math.ceil(total.rows[0].total / limit) },
      },
    });
  } catch (error) {
    return sendDatabaseError(error, res, "Unable to load your patients.", "Doctor patients error");
  }
};

const getServices = async (req, res) => {
  try {
    const doctor = await getDoctorProfile(req.user.id);
    if (!doctor) return res.status(404).json({ success: false, message: "Doctor profile not found." });
    const result = await pool.query(
      `SELECT c.id AS clinic_id, c.name AS clinic_name,
              s.id AS service_id, s.name, s.description, s.duration_minutes, s.fee
         FROM doctor_services ds
         JOIN services s ON s.id = ds.service_id AND s.clinic_id = ds.clinic_id
         JOIN clinics c ON c.id = ds.clinic_id
        WHERE ds.doctor_id = $1 AND ds.clinic_id = $2
          AND ds.is_active = TRUE AND s.is_active = TRUE
        ORDER BY s.name`,
      [doctor.id, doctor.clinic_id]
    );
    return res.json({ success: true, data: { services: result.rows } });
  } catch (error) {
    return sendDatabaseError(error, res, "Unable to load your services.", "Doctor services error");
  }
};

const listNotifications = async (req, res) => {
  const page = Math.max(1, Math.min(100000, Number(req.query.page) || 1));
  const limit = Math.max(1, Math.min(50, Number(req.query.limit) || 20));
  const read = req.query.read;
  if (read !== undefined && read !== "true" && read !== "false") {
    return res.status(400).json({ success: false, message: "read must be true or false." });
  }
  const values = [req.user.id];
  const filters = [`n.recipient_id = $1`,
    `(n.appointment_id IS NULL OR EXISTS (
       SELECT 1 FROM appointments a
        WHERE a.id = n.appointment_id AND a.doctor_id = (SELECT d.id FROM doctors d WHERE d.user_id = $1 AND d.is_active = TRUE)
     ))`];
  if (read !== undefined) {
    values.push(read === "true");
    filters.push(`n.is_read = $${values.length}`);
  }
  const where = filters.join(" AND ");
  try {
    const [count, rows] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int AS total FROM notifications n WHERE ${where}`, values),
      pool.query(
        `SELECT n.id, n.appointment_id, n.title, n.message, n.type, n.is_read, n.created_at
           FROM notifications n WHERE ${where}
          ORDER BY n.created_at DESC, n.id DESC
          LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
        [...values, limit, (page - 1) * limit]
      ),
    ]);
    return res.json({
      success: true,
      data: { notifications: rows.rows, pagination: { page, limit, total: count.rows[0].total, pages: Math.ceil(count.rows[0].total / limit) } },
    });
  } catch (error) {
    return sendDatabaseError(error, res, "Unable to load your notifications.", "Doctor notifications error");
  }
};

const markNotificationRead = async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE notifications n
          SET is_read = TRUE
        WHERE n.id = $1 AND n.recipient_id = $2
          AND (n.appointment_id IS NULL OR EXISTS (
            SELECT 1 FROM appointments a
             WHERE a.id = n.appointment_id
               AND a.doctor_id = (SELECT d.id FROM doctors d WHERE d.user_id = $2 AND d.is_active = TRUE)
          ))
        RETURNING n.id, n.is_read`,
      [req.params.notificationId, req.user.id]
    );
    if (!result.rowCount) return res.status(404).json({ success: false, message: "Notification not found." });
    return res.json({ success: true, data: { notification: result.rows[0] } });
  } catch (error) {
    return sendDatabaseError(error, res, "Unable to update this notification.", "Doctor notification update error");
  }
};

const markAllNotificationsRead = async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE notifications n SET is_read = TRUE
        WHERE n.recipient_id = $1 AND n.is_read = FALSE
          AND (n.appointment_id IS NULL OR EXISTS (
            SELECT 1 FROM appointments a
             WHERE a.id = n.appointment_id
               AND a.doctor_id = (SELECT d.id FROM doctors d WHERE d.user_id = $1 AND d.is_active = TRUE)
          ))`,
      [req.user.id]
    );
    return res.json({ success: true, data: { updated_count: result.rowCount } });
  } catch (error) {
    return sendDatabaseError(error, res, "Unable to update your notifications.", "Doctor notifications update error");
  }
};

module.exports = {
  getDashboard,
  listAppointments,
  getSchedule,
  listPatients,
  getServices,
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
};
