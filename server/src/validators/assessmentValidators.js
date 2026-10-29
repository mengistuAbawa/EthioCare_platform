const { body, param, validationResult } = require("express-validator");

const safetyAnswerKeys = new Set([
  "trouble_breathing",
  "severe_chest_pain",
  "stroke_signs",
  "severe_bleeding",
  "loss_of_consciousness",
  "severe_allergic_reaction",
]);

const handleAssessmentValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Assessment data is invalid.",
      errors: errors.array().map(({ path, msg }) => ({ field: path, message: msg })),
    });
  }
  return next();
};

const assessmentIdRules = [
  param("assessmentId").isInt({ min: 1 }).withMessage("Assessment ID must be a positive integer."),
];

const fileIdRules = [
  ...assessmentIdRules,
  param("fileId").isInt({ min: 1 }).withMessage("File ID must be a positive integer."),
];

const createAssessmentRules = [
  body("doctor_id").isInt({ min: 1 }).withMessage("Choose a doctor."),
  body("chief_complaint")
    .isString()
    .trim()
    .isLength({ min: 2, max: 2000 })
    .withMessage("Describe the main concern in 2 to 2000 characters."),
  body("symptoms")
    .optional()
    .isArray({ max: 30 })
    .withMessage("Symptoms must be a list of up to 30 items."),
  body("symptoms.*")
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage("Each symptom must be between 1 and 500 characters."),
  body("medical_history").optional().isString().isLength({ max: 5000 }),
  body("medications").optional().isString().isLength({ max: 3000 }),
  body("allergies").optional().isString().isLength({ max: 2000 }),
  body("symptom_onset").optional().isString().isLength({ max: 200 }),
  body("symptom_duration").optional().isString().isLength({ max: 200 }),
  body("symptom_frequency").optional().isString().isLength({ max: 200 }),
  body("severity").optional({ nullable: true, checkFalsy: true }).isInt({ min: 0, max: 10 })
    .withMessage("Severity must be between 0 and 10."),
  body("symptom_trend").optional().isIn(["", "improving", "stable", "worsening"])
    .withMessage("Choose a valid symptom trend."),
  body("previous_treatment").optional().isString().isLength({ max: 3000 }),
  body("additional_notes").optional().isString().isLength({ max: 5000 }),
  body("safety_answers").optional().custom((value) => {
    if (
      !value ||
      typeof value !== "object" ||
      Array.isArray(value) ||
      Object.entries(value).some(([key, answer]) => !safetyAnswerKeys.has(key) || !["yes", "no"].includes(answer))
    ) {
      throw new Error("Safety screening answers are invalid.");
    }
    return true;
  }),
  body("lab_results")
    .optional()
    .isArray({ max: 30 })
    .withMessage("Lab results must be a list of up to 30 items."),
  body("lab_results.*").optional().custom((result) => {
    if (
      !result ||
      typeof result !== "object" ||
      Array.isArray(result) ||
      typeof result.name !== "string" ||
      result.name.trim().length < 1 ||
      result.name.length > 200 ||
      typeof result.value !== "string" ||
      result.value.trim().length < 1 ||
      result.value.length > 500 ||
      (result.unit !== undefined && (typeof result.unit !== "string" || result.unit.length > 80)) ||
      (result.reference_interval !== undefined &&
        (typeof result.reference_interval !== "string" || result.reference_interval.length > 200)) ||
      (result.lab_name !== undefined && (typeof result.lab_name !== "string" || result.lab_name.length > 200)) ||
      (result.collected_at !== undefined && result.collected_at !== "" &&
        !/^\d{4}-\d{2}-\d{2}$/.test(result.collected_at))
    ) {
      throw new Error("Each lab result must include a name and a valid value.");
    }
    return true;
  }),
];

const reviewAssessmentRules = [
  ...assessmentIdRules,
  body("review_notes")
    .isString()
    .trim()
    .isLength({ min: 1, max: 10000 })
    .withMessage("Review notes are required and must be no more than 10000 characters."),
  body("status")
    .isIn(["in_review", "reviewed"])
    .withMessage("Status must be in_review or reviewed."),
];

const treatmentPlanRules = [
  ...assessmentIdRules,
  body("clinical_assessment").isString().trim().isLength({ min: 1, max: 5000 }),
  body("recommendations").isString().trim().isLength({ min: 1, max: 5000 }),
  body("medication_instructions").optional().isString().isLength({ max: 5000 }),
  body("non_medication_care").optional().isString().isLength({ max: 5000 }),
  body("investigations").optional().isString().isLength({ max: 3000 }),
  body("referral").optional().isString().isLength({ max: 3000 }),
  body("warning_signs").optional().isString().isLength({ max: 3000 }),
  body("follow_up_date").optional({ nullable: true, checkFalsy: true }).isISO8601()
    .withMessage("Follow-up date must be a valid date."),
  body("patient_explanation").isString().trim().isLength({ min: 1, max: 5000 }),
];

const treatmentPlanApprovalRules = [
  ...assessmentIdRules,
  param("planId").isInt({ min: 1 }).withMessage("Treatment plan ID must be a positive integer."),
];

const treatmentPlanUpdateRules = [
  ...treatmentPlanRules,
  param("planId").isInt({ min: 1 }).withMessage("Treatment plan ID must be a positive integer."),
];

const labResultReviewRules = [
  ...assessmentIdRules,
  param("labIndex").isInt({ min: 0 }).withMessage("Lab result index must be zero or greater."),
  body("verification_status").isIn(["verified", "corrected"]),
  body("name").isString().trim().isLength({ min: 1, max: 200 }),
  body("value").isString().trim().isLength({ min: 1, max: 500 }),
  body("unit").optional().isString().isLength({ max: 80 }),
  body("reference_interval").optional().isString().isLength({ max: 200 }),
  body("lab_name").optional().isString().isLength({ max: 200 }),
  body("collected_at").optional({ nullable: true, checkFalsy: true }).isISO8601(),
];

module.exports = {
  handleAssessmentValidationErrors,
  assessmentIdRules,
  fileIdRules,
  createAssessmentRules,
  reviewAssessmentRules,
  treatmentPlanRules,
  treatmentPlanApprovalRules,
  treatmentPlanUpdateRules,
  labResultReviewRules,
};
