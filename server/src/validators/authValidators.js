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

const registerRules = [
  body("full_name")
    .trim()
    .isLength({ min: 2, max: 120 })
    .withMessage("Full name is required and must be between 2 and 120 characters."),
  body("email")
    .trim()
    .normalizeEmail()
    .isEmail()
    .withMessage("A valid email address is required."),
  body("phone")
    .optional({ values: "falsy" })
    .trim()
    .custom((value) => value === "" || (value.length >= 7 && value.length <= 30))
    .withMessage("Phone number must be between 7 and 30 characters when provided."),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long."),
  body("confirmPassword")
    .notEmpty()
    .withMessage("Password confirmation is required.")
    .bail()
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Password confirmation does not match.");
      }
      return true;
    }),
  body("role")
    .custom((value) => {
      const forbiddenRoles = [
        "system_admin",
        "clinic_admin",
        "doctor",
        "receptionist",
      ];

      if (value && forbiddenRoles.includes(String(value).toLowerCase())) {
        throw new Error("Public registration cannot create privileged accounts.");
      }

      return true;
    })
    .optional(),
  body("is_active")
    .custom(() => {
      throw new Error("This field is not allowed.");
    })
    .optional(),
  body("is_verified")
    .custom(() => {
      throw new Error("This field is not allowed.");
    })
    .optional(),
  body("password_hash")
    .custom(() => {
      throw new Error("This field is not allowed.");
    })
    .optional(),
];

const loginRules = [
  body("email")
    .trim()
    .normalizeEmail()
    .isEmail()
    .withMessage("A valid email address is required."),
  body("password")
    .notEmpty()
    .withMessage("Password is required."),
];

const profileRules = [
  body("full_name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 120 })
    .withMessage("Full name must be between 2 and 120 characters."),
  body("phone")
    .optional({ values: "null" })
    .trim()
    .custom((value) => {
      if (value === "") {
        return true;
      }
      if (value.length < 7 || value.length > 30) {
        throw new Error("Phone number must be between 7 and 30 characters.");
      }
      return true;
    }),
  body("role")
    .custom(() => {
      throw new Error("Role changes are not allowed through profile updates.");
    })
    .optional(),
  body("email")
    .custom(() => {
      throw new Error("Email updates are not allowed through profile updates.");
    })
    .optional(),
  body("is_active")
    .custom(() => {
      throw new Error("This field is not allowed.");
    })
    .optional(),
  body("is_verified")
    .custom(() => {
      throw new Error("This field is not allowed.");
    })
    .optional(),
];

module.exports = {
  registerRules,
  loginRules,
  profileRules,
  handleValidationErrors,
};
