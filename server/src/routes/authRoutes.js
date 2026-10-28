const express = require("express");
const {
  register,
  login,
  getMe,
  logout,
  updateProfile,
} = require("../controllers/authController");
const { authenticate } = require("../middleware/authenticate");
const {
  registerRules,
  loginRules,
  profileRules,
  handleValidationErrors,
} = require("../validators/authValidators");

const router = express.Router();

router.post("/register", registerRules, handleValidationErrors, register);
router.post("/login", loginRules, handleValidationErrors, login);
router.get("/me", authenticate, getMe);
router.post("/logout", logout);
router.patch("/profile", authenticate, profileRules, handleValidationErrors, updateProfile);

module.exports = router;
