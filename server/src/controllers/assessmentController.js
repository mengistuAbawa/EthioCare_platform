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
    const assessment = await assessmentService.getAssessmentById(req.assessment.id);
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
  listPatientAssessments,
  getDoctorInbox,
  getAssessment,
  submitAssessment,
  reviewAssessment,
  createFileUpload,
  downloadFile,
};
