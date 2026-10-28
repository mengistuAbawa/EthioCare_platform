const express = require("express");
const { authenticate } = require("../middleware/authenticate");
const { requireSystemAdmin } = require("../middleware/clinicAccess");
const {
  getDashboardSummary,
  listClinics,
  getClinic,
  updateClinic,
  reviewClinic,
  updateClinicStatus,
  listUsers,
  listAppointments,
  listAuditLogs,
  listNotifications,
  markNotificationRead,
} = require("../controllers/adminController");
const {
  handleAdminValidationErrors,
  clinicListRules,
  clinicParamRules,
  clinicUpdateRules,
  clinicReviewRules,
  clinicStatusRules,
  userListRules,
  appointmentListRules,
  auditListRules,
  paginationRules,
  notificationParamRules,
} = require("../validators/adminValidators");

const router = express.Router();
router.use(authenticate, requireSystemAdmin);

router.get("/dashboard", getDashboardSummary);
router.get("/clinics", clinicListRules, handleAdminValidationErrors, listClinics);
router.get("/clinics/:clinicId", clinicParamRules, handleAdminValidationErrors, getClinic);
router.patch("/clinics/:clinicId", clinicUpdateRules, handleAdminValidationErrors, updateClinic);
router.post("/clinics/:clinicId/review", clinicReviewRules, handleAdminValidationErrors, reviewClinic);
router.patch("/clinics/:clinicId/status", clinicStatusRules, handleAdminValidationErrors, updateClinicStatus);
router.get("/users", userListRules, handleAdminValidationErrors, listUsers);
router.get("/appointments", appointmentListRules, handleAdminValidationErrors, listAppointments);
router.get("/audit-logs", auditListRules, handleAdminValidationErrors, listAuditLogs);
router.get("/notifications", paginationRules, handleAdminValidationErrors, listNotifications);
router.patch(
  "/notifications/:notificationId/read",
  notificationParamRules,
  handleAdminValidationErrors,
  markNotificationRead
);

module.exports = router;
