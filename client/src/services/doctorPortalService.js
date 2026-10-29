import api from "./api";

export const getDoctorDashboard = (date) => api.get("/doctor-portal/dashboard", { params: { from: date } });
export const getDoctorAppointments = (params) => api.get("/doctor-portal/appointments", { params });
export const getDoctorSchedule = (params) => api.get("/doctor-portal/schedule", { params });
export const getDoctorPatients = (params) => api.get("/doctor-portal/patients", { params });
export const getDoctorServices = () => api.get("/doctor-portal/services");
export const getDoctorNotifications = (params) => api.get("/doctor-portal/notifications", { params });
export const markDoctorNotificationRead = (notificationId) =>
  api.patch(`/doctor-portal/notifications/${notificationId}/read`);
export const markAllDoctorNotificationsRead = () => api.patch("/doctor-portal/notifications/read-all");
