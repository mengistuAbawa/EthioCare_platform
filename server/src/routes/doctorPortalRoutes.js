const express = require("express");
const { param, query, validationResult } = require("express-validator");
const { authenticate } = require("../middleware/authenticate");
const { authorize } = require("../middleware/authorize");
const { requireOperationalDoctorClinic } = require("../middleware/doctorClinicAccess");
const {
  getDashboard,
  listAppointments,
  getSchedule,
  listPatients,
  getServices,
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} = require("../controllers/doctorPortalController");

const router = express.Router();
router.use(authenticate, authorize("doctor"), requireOperationalDoctorClinic);

const validateQuery = [
  query("from").optional().isISO8601({ strict: true, strictSeparator: true }),
  query("to").optional().isISO8601({ strict: true, strictSeparator: true }),
  query("status").optional().isIn(["pending", "confirmed", "completed", "cancelled", "rejected", "no_show"]),
  query("search").optional().isString().isLength({ max: 100 }),
  query("page").optional().isInt({ min: 1, max: 100000 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 50 }).toInt(),
  query("read").optional().isIn(["true", "false"]),
];

const sendValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Invalid doctor portal request.",
      errors: errors.array().map(({ path, msg }) => ({ field: path, message: msg })),
    });
  }
  return next();
};

router.get("/dashboard", validateQuery, sendValidationErrors, getDashboard);
router.get("/appointments", validateQuery, sendValidationErrors, listAppointments);
router.get("/schedule", validateQuery, sendValidationErrors, getSchedule);
router.get("/patients", validateQuery, sendValidationErrors, listPatients);
router.get("/services", getServices);
router.get("/notifications", validateQuery, sendValidationErrors, listNotifications);
router.patch("/notifications/read-all", markAllNotificationsRead);
router.patch(
  "/notifications/:notificationId/read",
  param("notificationId").isInt({ min: 1, max: Number.MAX_SAFE_INTEGER }),
  sendValidationErrors,
  markNotificationRead
);

module.exports = router;
