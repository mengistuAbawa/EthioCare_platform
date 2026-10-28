const pool = require("../config/db");

const getClinicMembership = async (userId, clinicId) => {
  const result = await pool.query(
    `SELECT id, clinic_id, user_id, role, is_active
     FROM clinic_members
     WHERE clinic_id = $1 AND user_id = $2 AND is_active = TRUE
     LIMIT 1`,
    [clinicId, userId]
  );

  return result.rows[0] || null;
};

const requireOperationalClinic = async (clinicId, res) => {
  const result = await pool.query(
    "SELECT operational_status FROM clinics WHERE id = $1",
    [clinicId]
  );
  if (!result.rowCount) {
    res.status(404).json({ success: false, message: "Clinic not found." });
    return false;
  }
  if (result.rows[0].operational_status === "suspended") {
    res.status(403).json({ success: false, message: "This clinic is suspended." });
    return false;
  }
  return true;
};

const requireAuthenticatedUser = (req, res, next) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
  }

  return next();
};

const requireSystemAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "system_admin") {
    return res.status(403).json({
      success: false,
      message: "System administrator access is required.",
    });
  }

  return next();
};

const requireClinicAdminAccess = async (req, res, next) => {
  const clinicId = Number(req.params.id || req.params.clinicId || req.body.clinic_id);

  if (!Number.isSafeInteger(clinicId) || clinicId <= 0) {
    return res.status(400).json({
      success: false,
      message: "A valid clinic ID is required.",
    });
  }

  if (!req.user || req.user.role !== "clinic_admin") {
    return res.status(403).json({
      success: false,
      message: "Clinic administrator access is required.",
    });
  }

  try {
    const membership = await getClinicMembership(req.user.id, clinicId);

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to manage this clinic.",
      });
    }

    if (!(await requireOperationalClinic(clinicId, res))) return;
    req.clinicMembership = membership;
    return next();
  } catch (error) {
    console.error("Clinic admin access check failed:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to verify clinic access.",
    });
  }
};

const requireClinicStaffAccess = async (req, res, next) => {
  const clinicId = Number(req.params.id || req.params.clinicId || req.body.clinic_id);

  if (!Number.isSafeInteger(clinicId) || clinicId <= 0) {
    return res.status(400).json({
      success: false,
      message: "A valid clinic ID is required.",
    });
  }

  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
  }

  if (req.user.role === "system_admin") {
    return next();
  }

  try {
    const membership = await getClinicMembership(req.user.id, clinicId);

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this clinic.",
      });
    }

    if (!(await requireOperationalClinic(clinicId, res))) return;
    req.clinicMembership = membership;
    return next();
  } catch (error) {
    console.error("Clinic membership check failed:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to verify clinic access.",
    });
  }
};

const requireClinicOwnerOrAdmin = async (req, res, next) => {
  const clinicId = Number(req.params.id || req.params.clinicId || req.body.clinic_id);

  if (!Number.isSafeInteger(clinicId) || clinicId <= 0) {
    return res.status(400).json({
      success: false,
      message: "A valid clinic ID is required.",
    });
  }

  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
  }

  if (req.user.role === "system_admin") {
    return next();
  }

  try {
    const clinicResult = await pool.query(
      `SELECT id, created_by FROM clinics WHERE id = $1`,
      [clinicId]
    );

    if (clinicResult.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Clinic not found.",
      });
    }

    const clinic = clinicResult.rows[0];
    const isOwner = Number(clinic.created_by) === Number(req.user.id);
    const membership = await getClinicMembership(req.user.id, clinicId);

    if (!isOwner && !membership) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to access this clinic.",
      });
    }

    if (!(await requireOperationalClinic(clinicId, res))) return;
    req.clinic = clinic;
    return next();
  } catch (error) {
    console.error("Clinic ownership check failed:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to verify clinic ownership.",
    });
  }
};

module.exports = {
  requireAuthenticatedUser,
  requireSystemAdmin,
  requireClinicAdminAccess,
  requireClinicStaffAccess,
  requireClinicOwnerOrAdmin,
};
