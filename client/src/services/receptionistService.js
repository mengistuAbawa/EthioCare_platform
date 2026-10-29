import api from "./api";

export const getReceptionDashboard = (clinicId, date) =>
  api.get(`/receptionist/clinics/${clinicId}/dashboard`, { params: { date } });

export const getReceptionAppointments = (clinicId, date) =>
  api.get(`/receptionist/clinics/${clinicId}/appointments`, { params: { date } });

export const getReceptionPatients = (clinicId, search) =>
  api.get(`/receptionist/clinics/${clinicId}/patients`, { params: { search } });

export const getReceptionCatalog = (clinicId) =>
  api.get(`/receptionist/clinics/${clinicId}/catalog`);

export const createReceptionAppointment = (clinicId, appointment) =>
  api.post(`/receptionist/clinics/${clinicId}/appointments`, appointment);

export const updateReceptionAppointmentStatus = (clinicId, appointmentId, status) =>
  api.patch(`/receptionist/clinics/${clinicId}/appointments/${appointmentId}/status`, { status });
