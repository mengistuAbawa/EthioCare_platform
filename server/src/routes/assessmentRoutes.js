const express = require("express");
const { authenticate } = require("../middleware/authenticate");
const { authorize } = require("../middleware/authorize");
const { requireAssessmentAccess } = require("../middleware/assessmentAccess");
const { validateAssessmentUpload } = require("../middleware/uploadValidation");
const {
  createAssessment,
  updateDraftAssessment,
  listPatientAssessments,
  getDoctorInbox,
  getAssessment,
  submitAssessment,
  reviewAssessment,
  reviewLabResult,
  createTreatmentPlan,
  approveTreatmentPlan,
  updateTreatmentPlanDraft,
  getPatientTreatmentPlan,
  createFileUpload,
  downloadFile,
} = require("../controllers/assessmentController");
const {
  handleAssessmentValidationErrors,
  assessmentIdRules,
  fileIdRules,
  createAssessmentRules,
  reviewAssessmentRules,
  treatmentPlanRules,
  treatmentPlanApprovalRules,
  treatmentPlanUpdateRules,
  labResultReviewRules,
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
router.put(
  "/:assessmentId",
  authorize("patient"),
  assessmentIdRules,
  handleAssessmentValidationErrors,
  requireAssessmentAccess("patient"),
  createAssessmentRules,
  handleAssessmentValidationErrors,
  updateDraftAssessment
);
router.get(
  "/:assessmentId/treatment-plan",
  authorize("patient"),
  assessmentIdRules,
  handleAssessmentValidationErrors,
  requireAssessmentAccess("patient"),
  getPatientTreatmentPlan
);
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
router.post(
  "/:assessmentId/treatment-plans",
  authorize("doctor"),
  treatmentPlanRules,
  handleAssessmentValidationErrors,
  requireAssessmentAccess("doctor"),
  createTreatmentPlan
);
router.patch(
  "/:assessmentId/treatment-plans/:planId",
  authorize("doctor"),
  treatmentPlanUpdateRules,
  handleAssessmentValidationErrors,
  requireAssessmentAccess("doctor"),
  updateTreatmentPlanDraft
);
router.post(
  "/:assessmentId/treatment-plans/:planId/approve",
  authorize("doctor"),
  treatmentPlanApprovalRules,
  handleAssessmentValidationErrors,
  requireAssessmentAccess("doctor"),
  approveTreatmentPlan
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
  "/:assessmentId/lab-results/:labIndex/reviews",
  authorize("doctor"),
  labResultReviewRules,
  handleAssessmentValidationErrors,
  requireAssessmentAccess("doctor"),
  reviewLabResult
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
