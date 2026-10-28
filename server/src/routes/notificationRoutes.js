const express = require("express");
const { authenticate } = require("../middleware/authenticate");
const { authorize } = require("../middleware/authorize");
const {
  getUnreadNotificationCount,
  listMyNotifications,
  markMyNotificationRead,
  markAllMyNotificationsRead,
} = require("../controllers/notificationController");
const { param, query, validationResult } = require("express-validator");

const router = express.Router();

router.get("/unread-count", authenticate, getUnreadNotificationCount);
router.get(
  "/my",
  authenticate,
  authorize("patient"),
  [
    query("page").optional().isInt({ min: 1, max: 100000 }).toInt(),
    query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
    query("read").optional().isIn(["true", "false"]),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification filters.",
        errors: errors.array().map(({ path, msg }) => ({ field: path, message: msg })),
      });
    }
    return next();
  },
  listMyNotifications
);
router.patch("/my/read-all", authenticate, authorize("patient"), markAllMyNotificationsRead);
router.patch(
  "/my/:notificationId/read",
  authenticate,
  authorize("patient"),
  param("notificationId").isInt({ min: 1, max: Number.MAX_SAFE_INTEGER }),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification ID.",
        errors: errors.array().map(({ path, msg }) => ({ field: path, message: msg })),
      });
    }
    return next();
  },
  markMyNotificationRead
);

module.exports = router;
