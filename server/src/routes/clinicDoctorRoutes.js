const express = require("express");
const { authorize } = require("../middleware/authorize");
const { authenticate } = require("../middleware/authenticate");
const {
  requireClinicAdminAccess,
  requireClinicStaffAccess,
} = require("../middleware/clinicAccess");
const { requireClinicPermission } = require("../middleware/requireClinicPermission");
const {
  getClinicDoctorCandidates,
  createDoctorProfile,
  createDoctorAccountAndProfile,
  getClinicDoctors,
  getDoctorById,
  updateDoctorProfile,
  removeDoctorFromClinic,
  getDoctorServices,
  updateDoctorServices,
  resetDoctorPassword,
} = require("../controllers/doctorController");
const {
  handleDoctorValidationErrors,
  createDoctorRules,
  createDoctorAccountRules,
  clinicDoctorParamRules,
  updateDoctorRules,
  updateDoctorServicesRules,
  resetDoctorPasswordRules,
} = require("../validators/doctorValidators");

const router = express.Router();
const clinicStaff = authorize("system_admin", "clinic_admin", "receptionist");

router.get(
  "/:clinicId/doctors/candidates",
  authenticate,
  authorize("clinic_admin", "receptionist"),
  requireClinicStaffAccess,
  requireClinicPermission("doctors.manage"),
  handleDoctorValidationErrors,
  getClinicDoctorCandidates
);
router.post(
  "/:clinicId/doctors",
  authenticate,
  authorize("clinic_admin", "receptionist"),
  requireClinicStaffAccess,
  requireClinicPermission("doctors.manage"),
  createDoctorRules,
  handleDoctorValidationErrors,
  createDoctorProfile
);
router.post(
  "/:clinicId/doctors/account",
  authenticate,
  authorize("clinic_admin", "receptionist"),
  requireClinicStaffAccess,
  requireClinicPermission("doctors.manage"),
  createDoctorAccountRules,
  handleDoctorValidationErrors,
  createDoctorAccountAndProfile
);
router.get(
  "/:clinicId/doctors",
  authenticate,
  clinicStaff,
  requireClinicStaffAccess,
  requireClinicPermission("doctors.read"),
  handleDoctorValidationErrors,
  getClinicDoctors
);
router.get(
  "/:clinicId/doctors/:doctorId/services",
  authenticate,
  clinicStaff,
  requireClinicStaffAccess,
  requireClinicPermission("doctors.read"),
  clinicDoctorParamRules,
  handleDoctorValidationErrors,
  getDoctorServices
);
router.put(
  "/:clinicId/doctors/:doctorId/services",
  authenticate,
  authorize("clinic_admin", "receptionist"),
  requireClinicStaffAccess,
  requireClinicPermission("doctors.manage"),
  updateDoctorServicesRules,
  handleDoctorValidationErrors,
  updateDoctorServices
);
router.get(
  "/:clinicId/doctors/:doctorId",
  authenticate,
  clinicStaff,
  requireClinicStaffAccess,
  requireClinicPermission("doctors.read"),
  clinicDoctorParamRules,
  handleDoctorValidationErrors,
  getDoctorById
);
router.patch(
  "/:clinicId/doctors/:doctorId",
  authenticate,
  authorize("clinic_admin", "receptionist"),
  requireClinicStaffAccess,
  requireClinicPermission("doctors.manage"),
  updateDoctorRules,
  handleDoctorValidationErrors,
  updateDoctorProfile
);
router.patch(
  "/:clinicId/doctors/:doctorId/reset-password",
  authenticate,
  authorize("clinic_admin", "receptionist"),
  requireClinicStaffAccess,
  requireClinicPermission("doctors.manage"),
  resetDoctorPasswordRules,
  handleDoctorValidationErrors,
  resetDoctorPassword
);
router.delete(
  "/:clinicId/doctors/:doctorId",
  authenticate,
  authorize("clinic_admin", "receptionist"),
  requireClinicStaffAccess,
  requireClinicPermission("doctors.manage"),
  clinicDoctorParamRules,
  handleDoctorValidationErrors,
  removeDoctorFromClinic
);

module.exports = router;
