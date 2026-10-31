import api from "./api";

export const getAdminDashboard = () => api.get("/admin/dashboard");
export const getAdminClinics = (params) => api.get("/admin/clinics", { params });
export const getAdminClinic = (clinicId) => api.get(`/admin/clinics/${clinicId}`);
export const updateAdminClinic = (clinicId, payload) =>
  api.patch(`/admin/clinics/${clinicId}`, payload);
export const reviewAdminClinic = (clinicId, payload) =>
  api.post(`/admin/clinics/${clinicId}/review`, payload);
export const updateAdminClinicStatus = (clinicId, payload) =>
  api.patch(`/admin/clinics/${clinicId}/status`, payload);
export const getAdminUsers = (params) => api.get("/admin/users", { params });
export const createAdminManagedUser = (payload) => api.post("/admin/users", payload);
export const getAdminAppointments = (params) => api.get("/admin/appointments", { params });
export const getAdminAuditLogs = (params) => api.get("/admin/audit-logs", { params });
export const deleteAdminAuditLog = (logId) => api.delete(`/admin/audit-logs/${logId}`);
export const getAdminNotifications = (params) => api.get("/admin/notifications", { params });
export const markAdminNotificationRead = (notificationId) =>
  api.patch(`/admin/notifications/${notificationId}/read`);
export const getAdminPlatformSettings = () => api.get("/admin/settings");
export const updateAdminPlatformSettings = (settings) => api.put("/admin/settings", settings);
