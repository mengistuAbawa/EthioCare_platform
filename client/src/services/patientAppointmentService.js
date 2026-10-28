import api from "./api";

export const getMyAppointments = (params) => api.get("/appointments/my", { params });
