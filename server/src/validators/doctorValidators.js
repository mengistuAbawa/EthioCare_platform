const { body, param, query, validationResult } = require("express-validator");

const handleDoctorValidationErrors = (req, res, next) => {
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

const positiveId = (field) =>
  param(field)
    .isInt({ min: 1, max: Number.MAX_SAFE_INTEGER })
    .withMessage(`${field} must be a positive integer.`);

const publicDoctorQueryRules = [
  query("search").optional().isString().isLength({ max: 120 }),
  query("specialty").optional().isString().isLength({ max: 120 }),
  query("clinic_id").optional().isInt({ min: 1, max: Number.MAX_SAFE_INTEGER }),
  query("clinic").optional().isString().isLength({ max: 160 }),
  query("city").optional().isString().isLength({ max: 120 }),
  query("page").optional().isInt({ min: 1, max: 100000 }),
  query("limit").optional().isInt({ min: 1, max: 50 }),
  query("sort").optional().isIn(["name", "specialty", "fee"]),
  query("order").optional().isIn(["asc", "desc"]),
];

const doctorAuditQueryRules = [
  query("page").optional().isInt({ min: 1, max: 100000 }),
  query("limit").optional().isInt({ min: 1, max: 100 }),
];

const createDoctorRules = [
  positiveId("clinicId"),
  body().custom((value) => {
    const allowed = ["user_id", "specialty", "qualifications", "license_number", "consultation_fee"];
    if (Object.keys(value || {}).some((field) => !allowed.includes(field))) {
      throw new Error("Provide only supported doctor profile fields.");
    }
    return true;
  }),
  body("user_id")
    .isInt({ min: 1, max: Number.MAX_SAFE_INTEGER })
    .withMessage("A valid doctor account is required."),
  body("specialty").isString().trim().isLength({ min: 2, max: 120 }),
  body("qualifications").optional({ values: "null" }).isString().isLength({ max: 2000 }),
  body("license_number").isString().trim().isLength({ min: 2, max: 120 }),
  body("consultation_fee")
    .optional()
    .isFloat({ min: 0, max: 9999999999.99 })
    .toFloat()
    .withMessage("Consultation fee must be a non-negative number."),
];

const createDoctorAccountRules = [
  positiveId("clinicId"),
  body().custom((value) => {
    const allowed = [
      "full_name", "email", "phone", "password", "specialty",
      "qualifications", "license_number", "consultation_fee",
    ];
    if (Object.keys(value || {}).some((field) => !allowed.includes(field))) {
      throw new Error("Provide only supported doctor account fields.");
    }
    return true;
  }),
  body("full_name").isString().trim().isLength({ min: 2, max: 120 }),
  body("email").isEmail().normalizeEmail(),
  body("phone").optional({ values: "falsy" }).isString().trim().isLength({ min: 7, max: 30 }),
  body("password").isString().isLength({ min: 12, max: 128 }),
  body("specialty").isString().trim().isLength({ min: 2, max: 120 }),
  body("qualifications").optional({ values: "null" }).isString().isLength({ max: 2000 }),
  body("license_number").isString().trim().isLength({ min: 2, max: 120 }),
  body("consultation_fee").optional().isFloat({ min: 0, max: 9999999999.99 }).toFloat(),
];

const resetDoctorPasswordRules = [
  positiveId("clinicId"),
  positiveId("doctorId"),
  body("new_password")
    .isString()
    .isLength({ min: 12, max: 128 })
    .withMessage("New password must be between 12 and 128 characters."),
  body("confirm_password")
    .isString()
    .custom((value, { req }) => value === req.body.new_password)
    .withMessage("Password confirmation does not match."),
];

const clinicDoctorParamRules = [positiveId("clinicId"), positiveId("doctorId")];
const doctorIdRules = [positiveId("id")];

const updateDoctorRules = [
  ...clinicDoctorParamRules,
  body().custom((value) => {
    const allowed = [
      "specialty",
      "qualifications",
      "license_number",
      "consultation_fee",
      "is_available",
      "is_active",
      "is_profile_approved",
    ];
    const fields = Object.keys(value || {});

    if (!fields.length || fields.some((field) => !allowed.includes(field))) {
      throw new Error("Provide only supported doctor profile fields.");
    }

    return true;
  }),
  body("specialty").optional().isString().trim().isLength({ min: 2, max: 120 }),
  body("qualifications").optional({ values: "null" }).isString().isLength({ max: 2000 }),
  body("license_number").optional().isString().trim().isLength({ min: 2, max: 120 }),
  body("consultation_fee").optional().isFloat({ min: 0, max: 9999999999.99 }).toFloat(),
  body("is_available").optional().isBoolean().toBoolean(),
  body("is_active").optional().isBoolean().toBoolean(),
  body("is_profile_approved").optional().isBoolean().toBoolean(),
];

const updateMyDoctorRules = [
  body().custom((value) => {
    const allowed = ["specialty", "qualifications", "is_available"];
    const fields = Object.keys(value || {});

    if (!fields.length || fields.some((field) => !allowed.includes(field))) {
      throw new Error("Doctors may update only specialty, qualifications, and availability.");
    }

    return true;
  }),
  body("specialty").optional().isString().trim().isLength({ min: 2, max: 120 }),
  body("qualifications").optional({ values: "null" }).isString().isLength({ max: 2000 }),
  body("is_available").optional().isBoolean().toBoolean(),
];

const updateDoctorServicesRules = [
  ...clinicDoctorParamRules,
  body("service_ids")
    .isArray({ max: 100 })
    .withMessage("service_ids must be an array containing at most 100 service IDs."),
  body("service_ids.*")
    .isInt({ min: 1, max: Number.MAX_SAFE_INTEGER })
    .withMessage("Each service ID must be a positive integer."),
];

module.exports = {
  handleDoctorValidationErrors,
  publicDoctorQueryRules,
  doctorAuditQueryRules,
  createDoctorRules,
  createDoctorAccountRules,
  resetDoctorPasswordRules,
  clinicDoctorParamRules,
  doctorIdRules,
  updateDoctorRules,
  updateMyDoctorRules,
  updateDoctorServicesRules,
};
