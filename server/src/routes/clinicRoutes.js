const express = require("express");
const {
  listPublicClinics,
  getClinic,
  createClinic,
  updateClinic,
  listMyClinics,
  listClinicsForReview,
  reviewClinic,
} = require("../controllers/clinicController");
const { authenticate } = require("../middleware/authenticate");
const { authorize } = require("../middleware/authorize");
const {
  requireSystemAdmin,
  requireClinicOwnerOrAdmin,
} = require("../middleware/clinicAccess");
const {
  clinicCreateRules,
  clinicUpdateRules,
  clinicReviewRules,
  handleValidationErrors,
} = require("../validators/clinicValidators");

const router = express.Router();

router.get("/public", listPublicClinics);
router.get("/admin/pending", authenticate, requireSystemAdmin, listClinicsForReview);
router.get("/my/clinics", authenticate, listMyClinics);
router.post("/", authenticate, authorize("clinic_admin"), clinicCreateRules, handleValidationErrors, createClinic);
router.get("/:id", getClinic);
router.patch("/:id", authenticate, requireClinicOwnerOrAdmin, clinicUpdateRules, handleValidationErrors, updateClinic);
router.post("/:id/review", authenticate, requireSystemAdmin, clinicReviewRules, handleValidationErrors, reviewClinic);

module.exports = router;
