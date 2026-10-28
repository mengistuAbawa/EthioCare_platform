import api from "./api";

export const getPublicAssessmentDoctors = () => api.get("/doctors", { params: { limit: 50 } });

export const createAssessment = (payload) => api.post("/assessments", payload);

export const submitAssessment = (assessmentId) =>
  api.patch(`/assessments/${assessmentId}/submit`);

export const getMyAssessments = () => api.get("/assessments");

export const getAssessment = (assessmentId) => api.get(`/assessments/${assessmentId}`);

export const getDoctorAssessmentInbox = () => api.get("/assessments/doctor/inbox");

export const saveAssessmentReview = (assessmentId, payload) =>
  api.patch(`/assessments/${assessmentId}/review`, payload);

export const uploadAssessmentFile = (assessmentId, file) => {
  const formData = new FormData();
  formData.append("file", file);
  return api.post(`/assessments/${assessmentId}/files`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const getAssessmentFileDownloadUrl = (assessmentId, fileId) =>
  api.get(`/assessments/${assessmentId}/files/${fileId}/download`);
