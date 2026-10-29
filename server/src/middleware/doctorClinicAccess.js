const pool = require("../config/db");

const requireOperationalDoctorClinic = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT d.id
         FROM doctors d
         JOIN clinics c ON c.id = d.clinic_id
        WHERE d.user_id = $1
          AND d.is_active = TRUE
          AND d.is_profile_approved = TRUE
          AND c.verification_status = 'verified'
          AND c.operational_status = 'active'
        LIMIT 1`,
      [req.user.id]
    );
    if (result.rowCount === 0) {
      return res.status(403).json({
        success: false,
        message: "Your doctor profile or clinic is not available for operational access.",
      });
    }
    req.doctorProfileId = result.rows[0].id;
    return next();
  } catch (error) {
    console.error("Doctor clinic access check failed:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to verify doctor clinic access.",
    });
  }
};

module.exports = { requireOperationalDoctorClinic };
