const express = require("express");
const { authorize } = require("../middleware/authorize");
const { authenticate } = require("../middleware/authenticate");
const {
  requireClinicAdminAccess,
  requireClinicStaffAccess,
} = require("../middleware/clinicAccess");
const {
  getClinicDoctorCandidates,
  createDoctorProfile,
  getClinicDoctors,
  getDoctorById,
  updateDoctorProfile,
  removeDoctorFromClinic,
  getDoctorServices,
  updateDoctorServices,
} = require("../controllers/doctorController");
const {
  handleDoctorValidationErrors,
  createDoctorRules,
  clinicDoctorParamRules,
  updateDoctorRules,
  updateDoctorServicesRules,
} = require("../validators/doctorValidators");

const router = express.Router();
const clinicStaff = authorize("system_admin", "clinic_admin", "receptionist");
const clinicManagers = authorize("clinic_admin");

router.get(
  "/:clinicId/doctors/candidates",
  authenticate,
  authorize("clinic_admin"),
  requireClinicAdminAccess,
  handleDoctorValidationErrors,
  getClinicDoctorCandidates
);
router.post(
  "/:clinicId/doctors",
  authenticate,
  authorize("clinic_admin"),
  requireClinicAdminAccess,
  createDoctorRules,
  handleDoctorValidationErrors,
  createDoctorProfile
);
router.get(
  "/:clinicId/doctors",
  authenticate,
  clinicStaff,
  requireClinicStaffAccess,
  handleDoctorValidationErrors,
  getClinicDoctors
);
router.get(
  "/:clinicId/doctors/:doctorId/services",
  authenticate,
  clinicStaff,
  requireClinicStaffAccess,
  clinicDoctorParamRules,
  handleDoctorValidationErrors,
  getDoctorServices
);
router.put(
  "/:clinicId/doctors/:doctorId/services",
  authenticate,
  authorize("clinic_admin"),
  requireClinicAdminAccess,
  updateDoctorServicesRules,
  handleDoctorValidationErrors,
  updateDoctorServices
);
router.get(
  "/:clinicId/doctors/:doctorId",
  authenticate,
  clinicStaff,
  requireClinicStaffAccess,
  clinicDoctorParamRules,
  handleDoctorValidationErrors,
  getDoctorById
);
router.patch(
  "/:clinicId/doctors/:doctorId",
  authenticate,
  clinicManagers,
  requireClinicAdminAccess,
  updateDoctorRules,
  handleDoctorValidationErrors,
  updateDoctorProfile
);
router.delete(
  "/:clinicId/doctors/:doctorId",
  authenticate,
  authorize("clinic_admin"),
  requireClinicAdminAccess,
  clinicDoctorParamRules,
  handleDoctorValidationErrors,
  removeDoctorFromClinic
);

module.exports = router;
