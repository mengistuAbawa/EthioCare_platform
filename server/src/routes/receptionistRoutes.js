const express = require("express");
const { authenticate } = require("../middleware/authenticate");
const { requireReceptionistClinicAccess } = require("../middleware/receptionistClinicAccess");
const {
  getDashboard,
  listAppointments,
  listPatients,
  getClinicCatalog,
  createAppointment,
  updateAppointmentStatus,
} = require("../controllers/receptionistController");

const router = express.Router();
const clinicAccess = [authenticate, requireReceptionistClinicAccess];

router.get("/clinics/:clinicId/dashboard", ...clinicAccess, getDashboard);
router.get("/clinics/:clinicId/appointments", ...clinicAccess, listAppointments);
router.get("/clinics/:clinicId/patients", ...clinicAccess, listPatients);
router.get("/clinics/:clinicId/catalog", ...clinicAccess, getClinicCatalog);
router.post("/clinics/:clinicId/appointments", ...clinicAccess, createAppointment);
router.patch("/clinics/:clinicId/appointments/:appointmentId/status", ...clinicAccess, updateAppointmentStatus);

module.exports = router;
