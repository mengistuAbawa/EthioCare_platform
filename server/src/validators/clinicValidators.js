const { body, validationResult } = require("express-validator");

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed.",
      errors: errors.array().map((error) => ({
        field: error.path,
        message: error.msg,
      })),
    });
  }

  return next();
};

const clinicCreateRules = [
  body("slug")
    .trim()
    .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .withMessage("Clinic slug must be lowercase letters, numbers, or dashes only."),
  body("name")
    .trim()
    .isLength({ min: 2, max: 160 })
    .withMessage("Clinic name must be between 2 and 160 characters."),
  body("contact_email")
    .optional({ values: "falsy" })
    .trim()
    .isEmail()
    .withMessage("Contact email must be a valid email address."),
  body("contact_phone")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ min: 7, max: 30 })
    .withMessage("Contact phone must be between 7 and 30 characters when provided."),
  body("city")
    .trim()
    .isLength({ min: 2, max: 120 })
    .withMessage("City is required and must be between 2 and 120 characters."),
  body("region")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ min: 2, max: 120 })
    .withMessage("Region must be between 2 and 120 characters when provided."),
  body("address")
    .trim()
    .isLength({ min: 8, max: 250 })
    .withMessage("Address is required and must be between 8 and 250 characters."),
];

const clinicUpdateRules = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 160 })
    .withMessage("Clinic name must be between 2 and 160 characters."),
  body("contact_email")
    .optional({ values: "null" })
    .trim()
    .custom((value) => {
      if (value === "" || value === null) return true;
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        throw new Error("Contact email must be a valid email address.");
      }
      return true;
    }),
  body("contact_phone")
    .optional({ values: "null" })
    .trim()
    .custom((value) => {
      if (value === "" || value === null) return true;
      if (value.length < 7 || value.length > 30) {
        throw new Error("Contact phone must be between 7 and 30 characters when provided.");
      }
      return true;
    }),
  body("city")
    .optional()
    .trim()
    .isLength({ min: 2, max: 120 })
    .withMessage("City must be between 2 and 120 characters."),
  body("region")
    .optional({ values: "null" })
    .trim()
    .custom((value) => {
      if (value === "" || value === null) return true;
      if (value.length < 2 || value.length > 120) {
        throw new Error("Region must be between 2 and 120 characters when provided.");
      }
      return true;
    }),
  body("address")
    .optional()
    .trim()
    .isLength({ min: 8, max: 250 })
    .withMessage("Address must be between 8 and 250 characters."),
];

const clinicReviewRules = [
  body("decision")
    .trim()
    .toLowerCase()
    .isIn(["verified", "rejected"])
    .withMessage("Decision must be either verified or rejected."),
  body("reason")
    .optional({ values: "null" })
    .trim()
    .custom((value, { req }) => {
      if (req.body.decision === "rejected") {
        if (!value || value.length < 5) {
          throw new Error("A rejection reason of at least 5 characters is required.");
        }
      }
      return true;
    }),
];

module.exports = {
  clinicCreateRules,
  clinicUpdateRules,
  clinicReviewRules,
  handleValidationErrors,
};
