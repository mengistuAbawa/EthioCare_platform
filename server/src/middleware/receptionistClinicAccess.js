const pool = require("../config/db");

const requireReceptionistClinicAccess = async (req, res, next) => {
  const clinicId = Number(req.params.clinicId);
  if (!Number.isSafeInteger(clinicId) || clinicId <= 0) {
    return res.status(400).json({ success: false, message: "A valid clinic ID is required." });
  }

  if (req.user?.role !== "receptionist") {
    return res.status(403).json({ success: false, message: "Receptionist access is required." });
  }

  try {
    const result = await pool.query(
      `SELECT cm.id AS membership_id, c.operational_status
         FROM clinic_members cm
         JOIN clinics c ON c.id = cm.clinic_id
        WHERE cm.clinic_id = $1 AND cm.user_id = $2
          AND cm.role = 'receptionist' AND cm.is_active = TRUE`,
      [clinicId, req.user.id]
    );

    if (!result.rowCount) {
      return res.status(403).json({ success: false, message: "You do not have receptionist access to this clinic." });
    }
    if (result.rows[0].operational_status === "suspended") {
      return res.status(403).json({ success: false, message: "This clinic is suspended." });
    }

    req.receptionClinicId = clinicId;
    return next();
  } catch (error) {
    console.error("Receptionist clinic access check failed:", error.message);
    return res.status(500).json({ success: false, message: "Unable to verify clinic access." });
  }
};

module.exports = { requireReceptionistClinicAccess };
