const express = require("express");
const { query, validationResult } = require("express-validator");
const { authenticate } = require("../middleware/authenticate");
const { authorize } = require("../middleware/authorize");
const { listMyAppointments } = require("../controllers/patientAppointmentController");

const appointmentStatuses = ["pending", "confirmed", "completed", "cancelled", "rejected", "no_show"];
const validateAppointmentList = [
  query("page").optional().isInt({ min: 1, max: 100000 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
  query("period").optional().isIn(["upcoming", "history", "all"]),
  query("status").optional().isIn(appointmentStatuses),
];

const router = express.Router();

router.get(
  "/my",
  authenticate,
  authorize("patient"),
  validateAppointmentList,
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Invalid appointment filters.",
        errors: errors.array().map(({ path, msg }) => ({ field: path, message: msg })),
      });
    }
    return next();
  },
  listMyAppointments
);

module.exports = router;
