const { body, param, query, validationResult } = require("express-validator");

const handleAdminValidationErrors = (req, res, next) => {
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

const paginationRules = [
  query("page").optional().isInt({ min: 1, max: 100000 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
];

const clinicListRules = [
  ...paginationRules,
  query("search").optional().isString().isLength({ max: 120 }).trim(),
  query("verification_status").optional().isIn(["pending", "verified", "rejected"]),
  query("operational_status").optional().isIn(["active", "suspended"]),
];

const clinicParamRules = [positiveId("clinicId")];
const notificationParamRules = [positiveId("notificationId")];

const clinicUpdateRules = [
  ...clinicParamRules,
  body().custom((value) => {
    const allowed = ["name", "contact_email", "contact_phone", "city", "region", "address"];
    const fields = Object.keys(value || {});
    if (!fields.length || fields.some((field) => !allowed.includes(field))) {
      throw new Error("Provide only supported clinic profile fields.");
    }
    return true;
  }),
  body("name").optional().isString().trim().isLength({ min: 2, max: 160 }),
  body("contact_email").optional({ values: "null" }).isEmail().normalizeEmail(),
  body("contact_phone").optional({ values: "null" }).isString().trim().isLength({ min: 7, max: 30 }),
  body("city").optional().isString().trim().isLength({ min: 2, max: 120 }),
  body("region").optional({ values: "null" }).isString().trim().isLength({ min: 2, max: 120 }),
  body("address").optional().isString().trim().isLength({ min: 8, max: 250 }),
];

const clinicReviewRules = [
  ...clinicParamRules,
  body().custom((value) => {
    const allowed = ["decision", "reason"];
    if (Object.keys(value || {}).some((field) => !allowed.includes(field))) {
      throw new Error("Provide only a verification decision and optional reason.");
    }
    return true;
  }),
  body("decision").isIn(["verified", "rejected"]),
  body("reason").optional({ values: "null" }).isString().trim().isLength({ min: 5, max: 1000 }),
  body("reason").custom((value, { req }) => {
    if (req.body.decision === "rejected" && (!value || value.trim().length < 5)) {
      throw new Error("A rejection reason of at least 5 characters is required.");
    }
    return true;
  }),
];

const clinicStatusRules = [
  ...clinicParamRules,
  body().custom((value) => {
    if (Object.keys(value || {}).some((field) => !["status", "reason"].includes(field))) {
      throw new Error("Provide only the operational status and reason.");
    }
    return true;
  }),
  body("status").isIn(["active", "suspended"]),
  body("reason").isString().trim().isLength({ min: 5, max: 1000 }),
];

const userListRules = [
  ...paginationRules,
  query("search").optional().isString().isLength({ max: 120 }).trim(),
  query("role").optional().isIn(["system_admin", "clinic_admin", "doctor", "receptionist", "patient"]),
  query("roles").optional().matches(/^(clinic_admin|receptionist)(,(clinic_admin|receptionist))*$/),
  query("status").optional().isIn(["active", "inactive"]),
];

const createManagedUserRules = [
  body().custom((value) => {
    const allowed = ["full_name", "email", "phone", "password", "role", "clinic_id"];
    if (Object.keys(value || {}).some((field) => !allowed.includes(field))) {
      throw new Error("Provide only supported account fields.");
    }
    return true;
  }),
  body("full_name").isString().trim().isLength({ min: 2, max: 120 }),
  body("email").isEmail().normalizeEmail(),
  body("phone").optional({ values: "falsy" }).isString().trim().isLength({ min: 7, max: 30 }),
  body("password").isString().isLength({ min: 12, max: 128 }),
  body("role").isIn(["doctor", "clinic_admin", "receptionist"]),
  body("clinic_id").if((value, { req }) => ["clinic_admin", "receptionist"].includes(req.body.role))
    .isInt({ min: 1, max: Number.MAX_SAFE_INTEGER })
    .toInt()
    .withMessage("A valid clinic is required for clinic administrator and receptionist accounts."),
  body("clinic_id").if(body("role").equals("doctor"))
    .not().exists()
    .withMessage("Doctor accounts must be assigned through a clinic doctor workflow."),
];

const appointmentListRules = [
  ...paginationRules,
  query("status").optional().isIn(["pending", "confirmed", "completed", "cancelled", "rejected", "no_show"]),
  query("clinic_id").optional().isInt({ min: 1, max: Number.MAX_SAFE_INTEGER }).toInt(),
  query("doctor_id").optional().isInt({ min: 1, max: Number.MAX_SAFE_INTEGER }).toInt(),
  query("from").optional().isISO8601({ strict: true }),
  query("to").optional().isISO8601({ strict: true }),
  query("to").custom((value, { req }) => {
    if (value && req.query.from && new Date(value) < new Date(req.query.from)) {
      throw new Error("The end date must be on or after the start date.");
    }
    return true;
  }),
];

const auditListRules = [
  ...paginationRules,
  query("actor_id").optional().isInt({ min: 1, max: Number.MAX_SAFE_INTEGER }).toInt(),
  query("action").optional().isString().isLength({ max: 120 }).trim(),
  query("entity").optional().isString().isLength({ max: 120 }).trim(),
  query("from").optional().isISO8601({ strict: true }),
  query("to").optional().isISO8601({ strict: true }),
  query("to").custom((value, { req }) => {
    if (value && req.query.from && new Date(value) < new Date(req.query.from)) {
      throw new Error("The end date must be on or after the start date.");
    }
    return true;
  }),
];

const auditLogParamRules = [
  param("logId").isInt({ min: 1, max: Number.MAX_SAFE_INTEGER }).toInt(),
];

module.exports = {
  handleAdminValidationErrors,
  paginationRules,
  clinicListRules,
  clinicParamRules,
  clinicUpdateRules,
  clinicReviewRules,
  clinicStatusRules,
  userListRules,
  createManagedUserRules,
  appointmentListRules,
  auditListRules,
  auditLogParamRules,
  notificationParamRules,
};
