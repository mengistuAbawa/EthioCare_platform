import api from "./api";

export const getPublicAssessmentDoctors = (clinicId) =>
  api.get("/doctors", {
    params: {
      limit: 50,
      ...(clinicId ? { clinic_id: clinicId } : {}),
    },
  });

export const createAssessment = (payload) => api.post("/assessments", payload);

export const updateAssessmentDraft = (assessmentId, payload) =>
  api.put(`/assessments/${assessmentId}`, payload);

export const submitAssessment = (assessmentId) =>
  api.patch(`/assessments/${assessmentId}/submit`);

export const getMyAssessments = () => api.get("/assessments");

export const getAssessment = (assessmentId) => api.get(`/assessments/${assessmentId}`);

export const getDoctorAssessmentInbox = () => api.get("/assessments/doctor/inbox");

export const saveAssessmentReview = (assessmentId, payload) =>
  api.patch(`/assessments/${assessmentId}/review`, payload);

export const saveLabResultReview = (assessmentId, resultIndex, payload) =>
  api.post(`/assessments/${assessmentId}/lab-results/${resultIndex}/reviews`, payload);

export const createTreatmentPlan = (assessmentId, payload) =>
  api.post(`/assessments/${assessmentId}/treatment-plans`, payload);

export const updateTreatmentPlanDraft = (assessmentId, planId, payload) =>
  api.patch(`/assessments/${assessmentId}/treatment-plans/${planId}`, payload);

export const approveTreatmentPlan = (assessmentId, planId) =>
  api.post(`/assessments/${assessmentId}/treatment-plans/${planId}/approve`);

export const getPatientTreatmentPlan = (assessmentId) =>
  api.get(`/assessments/${assessmentId}/treatment-plan`);

export const uploadAssessmentFile = (assessmentId, file, onProgress) => {
  const formData = new FormData();
  formData.append("file", file);
  return api.post(`/assessments/${assessmentId}/files`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (event) => {
      if (event.total && onProgress) {
        onProgress(Math.round((event.loaded * 100) / event.total));
      }
    },
  });
};

export const getAssessmentFileDownloadUrl = (assessmentId, fileId) =>
  api.get(`/assessments/${assessmentId}/files/${fileId}/download`);
