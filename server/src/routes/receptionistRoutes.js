const express = require("express");
const { authenticate } = require("../middleware/authenticate");
const { requireReceptionistClinicAccess } = require("../middleware/receptionistClinicAccess");
const { requireClinicPermission } = require("../middleware/requireClinicPermission");
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

router.get("/clinics/:clinicId/dashboard", ...clinicAccess, requireClinicPermission("appointments.manage"), getDashboard);
router.get("/clinics/:clinicId/appointments", ...clinicAccess, requireClinicPermission("appointments.manage"), listAppointments);
router.get("/clinics/:clinicId/patients", ...clinicAccess, requireClinicPermission("patients.read"), listPatients);
router.get("/clinics/:clinicId/catalog", ...clinicAccess, requireClinicPermission("doctors.read"), getClinicCatalog);
router.post("/clinics/:clinicId/appointments", ...clinicAccess, requireClinicPermission("appointments.manage"), createAppointment);
router.patch("/clinics/:clinicId/appointments/:appointmentId/status", ...clinicAccess, requireClinicPermission("appointments.manage"), updateAppointmentStatus);

module.exports = router;
