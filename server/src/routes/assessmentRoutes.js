const express = require("express");
const { authenticate } = require("../middleware/authenticate");
const { authorize } = require("../middleware/authorize");
const { requireAssessmentAccess } = require("../middleware/assessmentAccess");
const { validateAssessmentUpload } = require("../middleware/uploadValidation");
const {
  createAssessment,
  listPatientAssessments,
  getDoctorInbox,
  getAssessment,
  submitAssessment,
  reviewAssessment,
  createFileUpload,
  downloadFile,
} = require("../controllers/assessmentController");
const {
  handleAssessmentValidationErrors,
  assessmentIdRules,
  fileIdRules,
  createAssessmentRules,
  reviewAssessmentRules,
} = require("../validators/assessmentValidators");

const router = express.Router();

router.use(authenticate);
router.get("/doctor/inbox", authorize("doctor"), getDoctorInbox);
router.post(
  "/",
  authorize("patient"),
  createAssessmentRules,
  handleAssessmentValidationErrors,
  createAssessment
);
router.get("/", authorize("patient"), listPatientAssessments);
router.get(
  "/:assessmentId",
  assessmentIdRules,
  handleAssessmentValidationErrors,
  requireAssessmentAccess("patient", "doctor"),
  getAssessment
);
router.patch(
  "/:assessmentId/submit",
  authorize("patient"),
  assessmentIdRules,
  handleAssessmentValidationErrors,
  requireAssessmentAccess("patient"),
  submitAssessment
);
router.patch(
  "/:assessmentId/review",
  authorize("doctor"),
  reviewAssessmentRules,
  handleAssessmentValidationErrors,
  requireAssessmentAccess("doctor"),
  reviewAssessment
);
router.post(
  "/:assessmentId/files",
  authorize("patient"),
  assessmentIdRules,
  handleAssessmentValidationErrors,
  requireAssessmentAccess("patient"),
  validateAssessmentUpload,
  createFileUpload
);
router.get(
  "/:assessmentId/files/:fileId/download",
  fileIdRules,
  handleAssessmentValidationErrors,
  requireAssessmentAccess("patient", "doctor"),
  downloadFile
);

module.exports = router;
