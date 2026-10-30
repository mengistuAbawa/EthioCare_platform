const express = require("express");
const {
  getPublicSettings,
} = require("../controllers/platformSettingsController");

const router = express.Router();
router.get("/", getPublicSettings);

module.exports = router;
