const pool = require("../config/db");
const { hasRolePermission, clinicIdsConflict } = require("../services/clinicAuthorizationService");

const requireClinicPermission = (permission) => async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Authentication required." });
  }
  if (req.user.role === "system_admin") return next();

  const clinicId = Number(req.params.clinicId || req.params.id || req.body?.clinic_id);
  if (!Number.isSafeInteger(clinicId) || clinicId <= 0) {
    return res.status(400).json({ success: false, message: "A valid clinic ID is required." });
  }

  try {
    let authorizedClinicId = null;
    if (req.user.role === "clinic_admin" || req.user.role === "receptionist") {
      const membership = await pool.query(
        `SELECT cm.clinic_id
           FROM clinic_members cm
          WHERE cm.clinic_id = $1 AND cm.user_id = $2
            AND cm.role = $3 AND cm.is_active = TRUE`,
        [clinicId, req.user.id, req.user.role]
      );
      if (!membership.rowCount) {
        return res.status(403).json({ success: false, message: "You are not authorized for this clinic." });
      }
      authorizedClinicId = membership.rows[0].clinic_id;
    } else if (req.user.role === "doctor") {
      const profile = await pool.query(
        `SELECT d.clinic_id
           FROM doctors d
           JOIN clinics c ON c.id = d.clinic_id
          WHERE d.user_id = $1 AND d.is_active = TRUE AND d.is_profile_approved = TRUE
            AND c.verification_status = 'verified' AND c.operational_status = 'active'
          LIMIT 1`,
        [req.user.id]
      );
      if (!profile.rowCount) {
        return res.status(403).json({ success: false, message: "Your doctor clinic is unavailable." });
      }
      authorizedClinicId = profile.rows[0].clinic_id;
    } else {
      return res.status(403).json({ success: false, message: "You do not have clinic staff permissions." });
    }

    if (clinicIdsConflict(Number(authorizedClinicId), clinicId)) {
      return res.status(404).json({ success: false, message: "Clinic resource not found." });
    }

    if (!hasRolePermission(req.user.role, permission)) {
      const grant = await pool.query(
        `SELECT 1
           FROM clinic_staff_permissions
          WHERE clinic_id = $1 AND user_id = $2 AND permission_code = $3
          LIMIT 1`,
        [clinicId, req.user.id, permission]
      );
      if (!grant.rowCount) {
        return res.status(403).json({ success: false, message: "You do not have permission for this operation." });
      }
    }

    req.authorizedClinicId = clinicId;
    return next();
  } catch (error) {
    console.error("Clinic permission check failed:", error.message);
    return res.status(500).json({ success: false, message: "Unable to verify clinic permissions." });
  }
};

module.exports = { requireClinicPermission };
