const express = require("express");
const { authorize } = require("../middleware/authorize");
const { authenticate } = require("../middleware/authenticate");
const { requireSystemAdmin } = require("../middleware/clinicAccess");
const {
  getPublicDoctors,
  getPublicDoctorById,
  getMyDoctorProfile,
  updateMyDoctorProfile,
  getDoctorStatistics,
  getDoctorAuditLog,
} = require("../controllers/doctorController");
const {
  handleDoctorValidationErrors,
  publicDoctorQueryRules,
  doctorIdRules,
  doctorAuditQueryRules,
  updateMyDoctorRules,
} = require("../validators/doctorValidators");

const router = express.Router();

router.get("/admin/statistics", authenticate, requireSystemAdmin, getDoctorStatistics);
router.get(
  "/admin/audit",
  authenticate,
  requireSystemAdmin,
  doctorAuditQueryRules,
  handleDoctorValidationErrors,
  getDoctorAuditLog
);
router.get("/me/profile", authenticate, authorize("doctor"), getMyDoctorProfile);
router.patch(
  "/me/profile",
  authenticate,
  authorize("doctor"),
  updateMyDoctorRules,
  handleDoctorValidationErrors,
  updateMyDoctorProfile
);
router.get("/", publicDoctorQueryRules, handleDoctorValidationErrors, getPublicDoctors);
router.get("/:id", doctorIdRules, handleDoctorValidationErrors, getPublicDoctorById);

module.exports = router;
