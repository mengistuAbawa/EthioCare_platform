const pool = require("../config/db");

const requireAssessmentAccess = (...allowedRoles) => async (req, res, next) => {
  try {
    const assessmentId = req.params.assessmentId;
    const result = await pool.query(
      `SELECT a.id, a.patient_id, a.doctor_id, a.status
         FROM patient_health_assessments a
        WHERE a.id = $1`,
      [assessmentId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: "Assessment not found." });
    }

    const assessment = result.rows[0];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "You cannot access this assessment." });
    }

    if (req.user.role === "patient" && String(assessment.patient_id) !== String(req.user.id)) {
      return res.status(404).json({ success: false, message: "Assessment not found." });
    }

    if (req.user.role === "doctor") {
      if (assessment.status === "draft") {
        return res.status(404).json({ success: false, message: "Assessment not found." });
      }
      const doctorResult = await pool.query(
        `SELECT d.id
           FROM doctors d
           JOIN clinics c ON c.id = d.clinic_id
                            AND c.verification_status = 'verified'
                            AND c.operational_status = 'active'
          WHERE d.id = $1 AND d.user_id = $2
            AND d.is_active = TRUE AND d.is_profile_approved = TRUE`,
        [assessment.doctor_id, req.user.id]
      );
      if (doctorResult.rowCount === 0) {
        return res.status(404).json({ success: false, message: "Assessment not found." });
      }
    }

    req.assessment = assessment;
    return next();
  } catch (error) {
    console.error("Assessment access check failed:", error.message);
    return res.status(500).json({ success: false, message: "Unable to verify assessment access." });
  }
};

module.exports = { requireAssessmentAccess };
