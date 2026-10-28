const { body, param, validationResult } = require("express-validator");

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
      result.value.length > 500 ||
      (result.unit !== undefined && (typeof result.unit !== "string" || result.unit.length > 80))
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

module.exports = {
  handleAssessmentValidationErrors,
  assessmentIdRules,
  fileIdRules,
  createAssessmentRules,
  reviewAssessmentRules,
};
