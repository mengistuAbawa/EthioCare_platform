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
        "SELECT id FROM doctors WHERE id = $1 AND user_id = $2 AND is_active = TRUE",
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
