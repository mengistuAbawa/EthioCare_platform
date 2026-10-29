const assessmentService = require("../services/assessmentService");

const handleError = (res, error, message) => {
  if (error.status) {
    return res.status(error.status).json({ success: false, message: error.message });
  }
  if (error.code === "23503" || error.code === "23514" || error.code === "22P02") {
    return res.status(400).json({ success: false, message: "Assessment data is invalid." });
  }
  console.error("Assessment operation failed:", error.message);
  return res.status(500).json({ success: false, message });
};

const createAssessment = async (req, res) => {
  try {
    const assessment = await assessmentService.createAssessment(req.user.id, req.body);
    return res.status(201).json({
      success: true,
      message: "Assessment draft saved.",
      data: { assessment },
    });
  } catch (error) {
    return handleError(res, error, "Unable to save the assessment.");
  }
};

const updateDraftAssessment = async (req, res) => {
  try {
    const assessment = await assessmentService.updateDraftAssessment(
      req.assessment.id,
      req.user.id,
      req.body
    );
    return res.status(200).json({
      success: true,
      message: "Assessment draft saved.",
      data: { assessment },
    });
  } catch (error) {
    return handleError(res, error, "Unable to update the assessment draft.");
  }
};

const listPatientAssessments = async (req, res) => {
  try {
    const assessments = await assessmentService.listPatientAssessments(req.user.id);
    return res.status(200).json({ success: true, data: { assessments } });
  } catch (error) {
    return handleError(res, error, "Unable to load assessment history.");
  }
};

const getDoctorInbox = async (req, res) => {
  try {
    const assessments = await assessmentService.getDoctorInbox(req.user.id);
    return res.status(200).json({ success: true, data: { assessments } });
  } catch (error) {
    return handleError(res, error, "Unable to load the assessment inbox.");
  }
};

const getAssessment = async (req, res) => {
  try {
    const assessment = await assessmentService.getAssessmentById(req.assessment.id, req.user.role);
    if (!assessment) {
      return res.status(404).json({ success: false, message: "Assessment not found." });
    }
    return res.status(200).json({ success: true, data: { assessment } });
  } catch (error) {
    return handleError(res, error, "Unable to load this assessment.");
  }
};

const submitAssessment = async (req, res) => {
  try {
    const assessment = await assessmentService.submitAssessment(req.assessment.id, req.user.id);
    return res.status(200).json({
      success: true,
      message: "Assessment submitted to your selected doctor.",
      data: { assessment },
    });
  } catch (error) {
    return handleError(res, error, "Unable to submit the assessment.");
  }
};

const reviewAssessment = async (req, res) => {
  try {
    const assessment = await assessmentService.reviewAssessment(
      req.assessment.id,
      req.user.id,
      req.body.review_notes,
      req.body.status
    );
    return res.status(200).json({
      success: true,
      message: "Assessment review saved.",
      data: { assessment },
    });
  } catch (error) {
    return handleError(res, error, "Unable to save the assessment review.");
  }
};

const reviewLabResult = async (req, res) => {
  try {
    const labReview = await assessmentService.reviewLabResult(
      req.assessment.id,
      Number(req.params.labIndex),
      req.user.id,
      req.body
    );
    return res.status(201).json({
      success: true,
      message: "Clinician lab review recorded. The patient-entered source value is preserved.",
      data: { lab_review: labReview },
    });
  } catch (error) {
    return handleError(res, error, "Unable to save the lab review.");
  }
};

const createTreatmentPlan = async (req, res) => {
  try {
    const plan = await assessmentService.createTreatmentPlan(
      req.assessment.id,
      req.user.id,
      req.body
    );
    return res.status(201).json({
      success: true,
      message: "Treatment plan draft saved. It is not available to the patient until approved.",
      data: { plan },
    });
  } catch (error) {
    return handleError(res, error, "Unable to save the treatment plan draft.");
  }
};

const approveTreatmentPlan = async (req, res) => {
  try {
    const plan = await assessmentService.approveTreatmentPlan(
      req.assessment.id,
      req.params.planId,
      req.user.id
    );
    return res.status(200).json({
      success: true,
      message: "Treatment plan approved and released to the patient.",
      data: { plan },
    });
  } catch (error) {
    return handleError(res, error, "Unable to approve the treatment plan.");
  }
};

const updateTreatmentPlanDraft = async (req, res) => {
  try {
    const plan = await assessmentService.updateTreatmentPlanDraft(
      req.assessment.id,
      req.params.planId,
      req.user.id,
      req.body
    );
    return res.status(200).json({
      success: true,
      message: "Treatment plan draft updated.",
      data: { plan },
    });
  } catch (error) {
    return handleError(res, error, "Unable to update the treatment plan draft.");
  }
};

const getPatientTreatmentPlan = async (req, res) => {
  try {
    const plan = await assessmentService.getPatientTreatmentPlan(
      req.assessment.id,
      req.user.id
    );
    return res.status(200).json({ success: true, data: { plan } });
  } catch (error) {
    return handleError(res, error, "Unable to load the approved treatment plan.");
  }
};

const createFileUpload = async (req, res) => {
  try {
    const upload = await assessmentService.createAssessmentFileUpload(
      req.assessment.id,
      req.file
    );
    return res.status(201).json({ success: true, data: { file: upload } });
  } catch (error) {
    return handleError(res, error, "Unable to prepare a secure file upload.");
  }
};

const downloadFile = async (req, res) => {
  try {
    const url = await assessmentService.getAssessmentFileDownloadUrl(
      req.assessment.id,
      req.params.fileId
    );
    return res.status(200).json({
      success: true,
      data: { url, expires_in: 60 },
    });
  } catch (error) {
    return handleError(res, error, "Unable to prepare the secure file download.");
  }
};

module.exports = {
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
};
