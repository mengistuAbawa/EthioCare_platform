import api from "./api";

export const getPublicDoctors = (params) => api.get("/doctors", { params });

export const getPublicDoctor = (doctorId) => api.get(`/doctors/${doctorId}`);

export const getMyDoctorProfile = () => api.get("/doctors/me/profile");

export const updateMyDoctorProfile = (payload) => api.patch("/doctors/me/profile", payload);

export const getClinicDoctors = (clinicId) => api.get(`/clinics/${clinicId}/doctors`);

export const getDoctorCandidates = (clinicId) =>
  api.get(`/clinics/${clinicId}/doctors/candidates`);

export const createDoctorProfile = (clinicId, payload) =>
  api.post(`/clinics/${clinicId}/doctors`, payload);

export const createDoctorAccount = (clinicId, payload) =>
  api.post(`/clinics/${clinicId}/doctors/account`, payload);

export const resetDoctorPassword = (clinicId, doctorId, payload) =>
  api.patch(`/clinics/${clinicId}/doctors/${doctorId}/reset-password`, payload);

export const getClinicDoctorServices = (clinicId, doctorId) =>
  api.get(`/clinics/${clinicId}/doctors/${doctorId}/services`);

export const updateClinicDoctorServices = (clinicId, doctorId, serviceIds) =>
  api.put(`/clinics/${clinicId}/doctors/${doctorId}/services`, { service_ids: serviceIds });

export const updateClinicDoctor = (clinicId, doctorId, payload) =>
  api.patch(`/clinics/${clinicId}/doctors/${doctorId}`, payload);

export const deactivateClinicDoctor = (clinicId, doctorId) =>
  api.delete(`/clinics/${clinicId}/doctors/${doctorId}`);
