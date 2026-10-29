const pool = require("../config/db");

const localDatePattern = /^\d{4}-\d{2}-\d{2}$/;
const parseDate = (value) => {
  const date = String(value || "");
  if (!localDatePattern.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00Z`))) return null;
  return new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) === date ? date : null;
};
const getQueryDate = (req, res) => {
  if (req.query.date && !parseDate(req.query.date)) {
    res.status(400).json({ success: false, message: "Date must use the YYYY-MM-DD format." });
    return null;
  }
  return parseDate(req.query.date) || new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Addis_Ababa",
  }).format(new Date());
};

const appointmentSelect = `
  SELECT a.id, a.status, a.starts_at, a.ends_at,
         p.id AS patient_id, p.full_name AS patient_name, p.phone AS patient_phone,
         d.id AS doctor_id, du.full_name AS doctor_name, d.specialty,
         s.id AS service_id, s.name AS service_name, s.fee
    FROM appointments a
    JOIN users p ON p.id = a.patient_id AND p.role = 'patient'
    JOIN doctors d ON d.id = a.doctor_id
    JOIN users du ON du.id = d.user_id
    JOIN services s ON s.id = a.service_id`;

const getDashboard = async (req, res) => {
  const day = getQueryDate(req, res);
  if (!day) return;
  try {
    const [stats, appointments] = await Promise.all([
      pool.query(
        `SELECT COUNT(*)::int AS total,
                COUNT(*) FILTER (WHERE status = 'pending')::int AS pending,
                COUNT(*) FILTER (WHERE status = 'confirmed')::int AS confirmed,
                COUNT(*) FILTER (WHERE status = 'completed')::int AS completed,
                COUNT(*) FILTER (WHERE status IN ('cancelled', 'rejected', 'no_show'))::int AS closed
           FROM appointments
          WHERE clinic_id = $1
            AND starts_at >= ($2::date::timestamp AT TIME ZONE 'Africa/Addis_Ababa')
            AND starts_at < (($2::date + 1)::timestamp AT TIME ZONE 'Africa/Addis_Ababa')`,
        [req.receptionClinicId, day]
      ),
      pool.query(
        `${appointmentSelect}
          WHERE a.clinic_id = $1
            AND a.starts_at >= ($2::date::timestamp AT TIME ZONE 'Africa/Addis_Ababa')
            AND a.starts_at < (($2::date + 1)::timestamp AT TIME ZONE 'Africa/Addis_Ababa')
          ORDER BY a.starts_at, a.id`,
        [req.receptionClinicId, day]
      ),
    ]);
    return res.json({ success: true, data: { date: day, stats: stats.rows[0], appointments: appointments.rows } });
  } catch (error) {
    console.error("Reception dashboard error:", error.message);
    return res.status(500).json({ success: false, message: "Unable to load clinic reception data." });
  }
};

const listAppointments = async (req, res) => {
  const day = getQueryDate(req, res);
  if (!day) return;
  const status = String(req.query.status || "");
  const statuses = ["pending", "confirmed", "completed", "cancelled", "rejected", "no_show"];
  if (status && !statuses.includes(status)) {
    return res.status(400).json({ success: false, message: "Invalid appointment status." });
  }

  try {
    const values = [req.receptionClinicId, day];
    let statusFilter = "";
    if (status) {
      values.push(status);
      statusFilter = ` AND a.status = $${values.length}`;
    }
    const result = await pool.query(
      `${appointmentSelect}
        WHERE a.clinic_id = $1
          AND a.starts_at >= ($2::date::timestamp AT TIME ZONE 'Africa/Addis_Ababa')
          AND a.starts_at < (($2::date + 1)::timestamp AT TIME ZONE 'Africa/Addis_Ababa')${statusFilter}
        ORDER BY a.starts_at, a.id`,
      values
    );
    return res.json({ success: true, data: { date: day, appointments: result.rows } });
  } catch (error) {
    console.error("Reception appointment list error:", error.message);
    return res.status(500).json({ success: false, message: "Unable to load appointments." });
  }
};

const listPatients = async (req, res) => {
  const search = String(req.query.search || "").trim().slice(0, 100);
  try {
    const result = await pool.query(
      `SELECT u.id, u.full_name, u.email, u.phone,
              MAX(a.starts_at) AS last_appointment_at,
              COUNT(a.id)::int AS appointment_count
         FROM appointments a
         JOIN users u ON u.id = a.patient_id AND u.role = 'patient' AND u.is_active = TRUE
        WHERE a.clinic_id = $1
          AND ($2 = '' OR u.full_name ILIKE '%' || $2 || '%' OR u.email ILIKE '%' || $2 || '%' OR COALESCE(u.phone, '') ILIKE '%' || $2 || '%')
        GROUP BY u.id, u.full_name, u.email, u.phone
        ORDER BY u.full_name
        LIMIT 100`,
      [req.receptionClinicId, search]
    );
    return res.json({ success: true, data: { patients: result.rows } });
  } catch (error) {
    console.error("Reception patient list error:", error.message);
    return res.status(500).json({ success: false, message: "Unable to load the patient directory." });
  }
};

const getClinicCatalog = async (req, res) => {
  try {
    const [doctors, services] = await Promise.all([
      pool.query(
        `SELECT d.id, u.full_name AS name, d.specialty, d.consultation_fee,
                d.is_available,
               (SELECT COALESCE(json_agg(json_build_object(
                  'day_of_week', wh.day_of_week,
                  'start_time', to_char(wh.start_time, 'HH24:MI'),
                  'end_time', to_char(wh.end_time, 'HH24:MI')
                ) ORDER BY wh.day_of_week), '[]'::json)
                  FROM working_hours wh
                 WHERE wh.doctor_id = d.id AND wh.is_available = TRUE) AS working_hours,
               (SELECT COALESCE(json_agg(json_build_object(
                  'starts_at', t.starts_at,
                  'ends_at', t.ends_at
                ) ORDER BY t.starts_at), '[]'::json)
                  FROM time_off t
                 WHERE t.doctor_id = d.id AND t.ends_at > now()
                   AND t.starts_at < now() + interval '60 days') AS upcoming_time_off,
               COALESCE(json_agg(json_build_object('id', s.id, 'name', s.name, 'fee', s.fee, 'duration_minutes', s.duration_minutes))
                 FILTER (WHERE s.id IS NOT NULL), '[]'::json) AS services
           FROM doctors d
           JOIN users u ON u.id = d.user_id AND u.role = 'doctor' AND u.is_active = TRUE
           LEFT JOIN doctor_services ds ON ds.doctor_id = d.id AND ds.clinic_id = d.clinic_id AND ds.is_active = TRUE
           LEFT JOIN services s ON s.id = ds.service_id AND s.clinic_id = d.clinic_id AND s.is_active = TRUE
          WHERE d.clinic_id = $1 AND d.is_active = TRUE
          GROUP BY d.id, u.full_name
          ORDER BY u.full_name`,
        [req.receptionClinicId]
      ),
      pool.query(
        `SELECT id, name, description, fee, duration_minutes
           FROM services WHERE clinic_id = $1 AND is_active = TRUE ORDER BY name`,
        [req.receptionClinicId]
      ),
    ]);
    return res.json({ success: true, data: { doctors: doctors.rows, services: services.rows } });
  } catch (error) {
    console.error("Reception catalog error:", error.message);
    return res.status(500).json({ success: false, message: "Unable to load clinic doctors and services." });
  }
};

const createAppointment = async (req, res) => {
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const patientId = Number(body.patient_id);
  const doctorId = Number(body.doctor_id);
  const serviceId = Number(body.service_id);
  const startsAt = new Date(body.starts_at);
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";

  if (![patientId, doctorId, serviceId].every((id) => Number.isSafeInteger(id) && id > 0) ||
      typeof body.starts_at !== "string" ||
      !/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(body.starts_at) ||
      Number.isNaN(startsAt.getTime()) || startsAt <= new Date()) {
    return res.status(400).json({ success: false, message: "Choose an existing patient, doctor, service, and future appointment time." });
  }
  if (reason.length > 1000) return res.status(400).json({ success: false, message: "The appointment reason is too long." });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const patient = await client.query(
      `SELECT u.id
         FROM users u
        WHERE u.id = $1
          AND u.role = 'patient'
          AND u.is_active = TRUE
          AND EXISTS (
            SELECT 1 FROM appointments a
             WHERE a.patient_id = u.id AND a.clinic_id = $2
          )
        FOR SHARE OF u`,
      [patientId, req.receptionClinicId]
    );
    if (!patient.rowCount) {
      await client.query("ROLLBACK");
      return res.status(404).json({ success: false, message: "An active patient account was not found." });
    }
    const schedule = await client.query(
      `SELECT s.duration_minutes, s.name AS service_name
         FROM doctors d
         JOIN doctor_services ds ON ds.doctor_id = d.id AND ds.clinic_id = d.clinic_id AND ds.is_active = TRUE
         JOIN services s ON s.id = ds.service_id AND s.clinic_id = d.clinic_id AND s.is_active = TRUE
        WHERE d.id = $1 AND d.clinic_id = $2 AND d.is_active = TRUE AND d.is_available = TRUE
          AND s.id = $3
        FOR SHARE OF d, s`,
      [doctorId, req.receptionClinicId, serviceId]
    );
    if (!schedule.rowCount) {
      await client.query("ROLLBACK");
      return res.status(400).json({ success: false, message: "The selected doctor and service are not currently available at this clinic." });
    }
    const duration = schedule.rows[0].duration_minutes;
    const end = new Date(startsAt.getTime() + duration * 60_000);
    const availability = await client.query(
      `SELECT EXISTS (
         SELECT 1 FROM working_hours wh
          WHERE wh.doctor_id = $1 AND wh.is_available = TRUE
            AND wh.day_of_week = EXTRACT(DOW FROM ($2::timestamptz AT TIME ZONE 'Africa/Addis_Ababa'))::int
            AND wh.start_time <= ($2::timestamptz AT TIME ZONE 'Africa/Addis_Ababa')::time
            AND wh.end_time >= ($3::timestamptz AT TIME ZONE 'Africa/Addis_Ababa')::time
       ) AS during_working_hours,
       EXISTS (
         SELECT 1 FROM time_off t
          WHERE t.doctor_id = $1 AND t.starts_at < $3::timestamptz AND t.ends_at > $2::timestamptz
       ) AS on_time_off`,
      [doctorId, startsAt.toISOString(), end.toISOString()]
    );
    if (!availability.rows[0].during_working_hours || availability.rows[0].on_time_off) {
      await client.query("ROLLBACK");
      return res.status(409).json({ success: false, message: "The requested time is outside the doctor’s availability." });
    }

    const created = await client.query(
      `INSERT INTO appointments (patient_id, doctor_id, clinic_id, service_id, starts_at, ends_at, status, reason)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7)
       RETURNING id, status, starts_at, ends_at`,
      [patientId, doctorId, req.receptionClinicId, serviceId, startsAt.toISOString(), end.toISOString(), reason || null]
    );
    const appointment = created.rows[0];
    await client.query(
      `INSERT INTO notifications (recipient_id, appointment_id, title, message, type)
       VALUES ($1, $2, 'Appointment requested', $3, 'appointment')`,
      [patientId, appointment.id, `Your appointment request for ${schedule.rows[0].service_name} is pending confirmation.`]
    );
    await client.query(
      `INSERT INTO audit_logs (actor_id, action, entity, entity_id, details)
       VALUES ($1, 'appointment_created_by_reception', 'appointments', $2, $3::jsonb)`,
      [req.user.id, String(appointment.id), JSON.stringify({ clinic_id: req.receptionClinicId, patient_id: patientId })]
    );
    await client.query("COMMIT");
    return res.status(201).json({ success: true, message: "Appointment request created.", data: { appointment } });
  } catch (error) {
    try { await client.query("ROLLBACK"); } catch (rollbackError) {
      console.error("Reception appointment rollback failed:", rollbackError.message);
    }
    if (error.code === "23P01" || error.code === "23505") {
      return res.status(409).json({ success: false, message: "The patient or doctor already has an appointment at that time." });
    }
    if (error.code === "23503" || error.code === "23514") {
      return res.status(400).json({ success: false, message: "The appointment details are not valid." });
    }
    console.error("Reception appointment creation error:", error.message);
    return res.status(500).json({ success: false, message: "Unable to create the appointment request." });
  } finally {
    client.release();
  }
};

const updateAppointmentStatus = async (req, res) => {
  const appointmentId = Number(req.params.appointmentId);
  const nextStatus = req.body && typeof req.body === "object" ? req.body.status : null;
  const transitions = {
    pending: ["confirmed", "rejected", "cancelled"],
    confirmed: ["cancelled", "no_show"],
  };
  if (!Number.isSafeInteger(appointmentId) || appointmentId <= 0 ||
      !Object.values(transitions).some((statuses) => statuses.includes(nextStatus))) {
    return res.status(400).json({ success: false, message: "Invalid appointment status update." });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      `UPDATE appointments
          SET status = $1, updated_at = now()
        WHERE id = $2 AND clinic_id = $3
          AND status = ANY($4::text[])
        RETURNING id, status, starts_at, ends_at`,
      [nextStatus, appointmentId, req.receptionClinicId, Object.keys(transitions).filter((from) => transitions[from].includes(nextStatus))]
    );
    if (!result.rowCount) {
      await client.query("ROLLBACK");
      return res.status(409).json({ success: false, message: "The appointment was not found or can no longer be changed." });
    }
    await client.query(
      `INSERT INTO audit_logs (actor_id, action, entity, entity_id, details)
       VALUES ($1, 'appointment_status_updated_by_reception', 'appointments', $2, $3::jsonb)`,
      [req.user.id, String(appointmentId), JSON.stringify({ clinic_id: req.receptionClinicId, status: nextStatus })]
    );
    await client.query("COMMIT");
    return res.json({ success: true, data: { appointment: result.rows[0] } });
  } catch (error) {
    try { await client.query("ROLLBACK"); } catch (rollbackError) {
      console.error("Reception status rollback failed:", rollbackError.message);
    }
    console.error("Reception appointment status update error:", error.message);
    return res.status(500).json({ success: false, message: "Unable to update appointment status." });
  } finally {
    client.release();
  }
};

module.exports = {
  getDashboard,
  listAppointments,
  listPatients,
  getClinicCatalog,
  createAppointment,
  updateAppointmentStatus,
};
