import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  createAssessment,
  getAssessment,
  getPublicAssessmentDoctors,
  submitAssessment,
  updateAssessmentDraft,
  uploadAssessmentFile,
} from "../../services/assessmentService";
import AiSummaryPanel from "../../components/assessment/AiSummaryPanel";
import LabResultForm from "../../components/assessment/LabResultForm";
import MedicalFileUploader from "../../components/assessment/MedicalFileUploader";
import OcrVerificationPanel from "../../components/assessment/OcrVerificationPanel";
import SymptomForm from "../../components/assessment/SymptomForm";
import { Button, PageHeader } from "../../components/ui/Primitives";

const fileKey = (file) => `${file.name}:${file.size}:${file.lastModified}`;
const emergencyAnswerKeys = [
  "trouble_breathing",
  "severe_chest_pain",
  "stroke_signs",
  "severe_bleeding",
  "loss_of_consciousness",
  "severe_allergic_reaction",
];
const emptyForm = {
  doctor_id: "",
  chief_complaint: "",
  symptoms: "",
  medical_history: "",
  medications: "",
  allergies: "",
  symptom_onset: "",
  symptom_duration: "",
  symptom_frequency: "",
  severity: "",
  symptom_trend: "",
  previous_treatment: "",
  additional_notes: "",
  safety_answers: {},
};

const steps = ["Symptoms", "Medical history", "Files and review"];

export default function HealthAssessment() {
  const navigate = useNavigate();
  const { assessmentId: routeAssessmentId } = useParams();
  const [searchParams] = useSearchParams();
  const selectedClinicId = searchParams.get("clinicId") || "";
  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [loadingDraft, setLoadingDraft] = useState(Boolean(routeAssessmentId));
  const [doctorError, setDoctorError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [labResults, setLabResults] = useState([]);
  const [files, setFiles] = useState([]);
  const [existingFiles, setExistingFiles] = useState([]);
  const [assessmentId, setAssessmentId] = useState(routeAssessmentId || "");
  const [uploadedFiles, setUploadedFiles] = useState(new Set());
  const [uploadProgress, setUploadProgress] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [step, setStep] = useState(1);

  useEffect(() => {
    let active = true;
    getPublicAssessmentDoctors(selectedClinicId)
      .then((response) => {
        if (active) setDoctors(response.data?.data?.doctors || []);
      })
      .catch((error) => {
        if (active) setDoctorError(error.response?.data?.message || "Unable to load available doctors.");
      })
      .finally(() => {
        if (active) setLoadingDoctors(false);
      });
    return () => {
      active = false;
    };
  }, [selectedClinicId]);

  useEffect(() => {
    if (!routeAssessmentId) return undefined;
    let active = true;
    getAssessment(routeAssessmentId)
      .then((response) => {
        if (!active) return;
        const draft = response.data?.data?.assessment;
        if (!draft || draft.status !== "draft") {
          navigate(`/patient/assessments/${routeAssessmentId}`, { replace: true });
          return;
        }
        setAssessmentId(String(draft.id));
        setForm({
          ...emptyForm,
          doctor_id: String(draft.doctor_id),
          chief_complaint: draft.chief_complaint || "",
          symptoms: (draft.symptoms || []).join("\n"),
          medical_history: draft.medical_history || "",
          medications: draft.medications || "",
          allergies: draft.allergies || "",
          symptom_onset: draft.symptom_onset || "",
          symptom_duration: draft.symptom_duration || "",
          symptom_frequency: draft.symptom_frequency || "",
          severity: draft.severity === null ? "" : String(draft.severity),
          symptom_trend: draft.symptom_trend || "",
          previous_treatment: draft.previous_treatment || "",
          additional_notes: draft.additional_notes || "",
          safety_answers: draft.safety_answers || {},
        });
        setLabResults(draft.lab_results || []);
        setExistingFiles(draft.files || []);
      })
      .catch((error) => {
        if (active) setErrorMessage(error.response?.data?.message || "Unable to load your draft.");
      })
      .finally(() => {
        if (active) setLoadingDraft(false);
      });
    return () => {
      active = false;
    };
  }, [routeAssessmentId, navigate]);

  const payload = useMemo(() => ({
    doctor_id: form.doctor_id,
    chief_complaint: form.chief_complaint,
    symptoms: form.symptoms.split(/\r?\n/).map((item) => item.trim()).filter(Boolean),
    medical_history: form.medical_history,
    medications: form.medications,
    allergies: form.allergies,
    symptom_onset: form.symptom_onset,
    symptom_duration: form.symptom_duration,
    symptom_frequency: form.symptom_frequency,
    severity: form.severity,
    symptom_trend: form.symptom_trend,
    previous_treatment: form.previous_treatment,
    additional_notes: form.additional_notes,
    safety_answers: form.safety_answers,
    lab_results: labResults.filter((item) => item.name.trim() || item.value.trim()),
  }), [form, labResults]);

  const persistDraft = async () => {
    if (!form.doctor_id || form.chief_complaint.trim().length < 2) {
      throw new Error("Choose a doctor and describe your main concern before saving.");
    }
    if (payload.lab_results.some((item) => !item.name.trim() || !item.value.trim())) {
      throw new Error("Each lab result must include both a test name and a reported value.");
    }
    let id = assessmentId;
    if (!id) {
      const response = await createAssessment(payload);
      id = String(response.data.data.assessment.id);
      setAssessmentId(id);
    } else {
      await updateAssessmentDraft(id, payload);
    }

    const completedFiles = new Set(uploadedFiles);
    for (const file of files) {
      const key = fileKey(file);
      if (completedFiles.has(key)) continue;
      await uploadAssessmentFile(id, file, (progress) => {
        setUploadProgress((current) => ({ ...current, [key]: progress }));
      });
      completedFiles.add(key);
      setUploadedFiles(new Set(completedFiles));
      setExistingFiles((current) => [
        ...current,
        { id: `local-${key}`, original_filename: file.name, upload_status: "uploaded" },
      ]);
    }
    return id;
  };

  const handleSaveDraft = async () => {
    setSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const id = await persistDraft();
      setSuccessMessage("Draft saved. You can return to it later from assessment history.");
      navigate(`/patient/assessment/${id}/edit`, { replace: true });
    } catch (error) {
      setErrorMessage(error.response?.data?.message || error.message || "Unable to save the draft.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleContinue = (event) => {
    event.preventDefault();
    setErrorMessage("");
    if (step < steps.length) setStep((current) => current + 1);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const id = await persistDraft();
      await submitAssessment(id);
      navigate(`/patient/assessments/${id}`);
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message ||
          error.message ||
          "Unable to submit the assessment. Your saved draft has not been removed."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const urgentAnswer = emergencyAnswerKeys.some((key) => form.safety_answers?.[key] === "yes");
  const selectedClinicName = doctors.find((doctor) => String(doctor.clinic_id) === String(selectedClinicId))?.clinic_name || "";

  if (loadingDraft) {
    return <p className="mx-auto max-w-4xl rounded-xl bg-white p-5 text-slate-600">Loading draft…</p>;
  }

  return (
    <div>
      <div className="mx-auto max-w-4xl space-y-5">
        <PageHeader
          title={assessmentId ? "Edit assessment draft" : "Health assessment"}
          description={selectedClinicName ? `Share health information with ${selectedClinicName}.` : "Share information with the verified clinic and doctor you select."}
          actions={<Link to="/patient/assessments" className="ui-button ui-button-secondary">View assessment history</Link>}
        />

        {selectedClinicId && (
          <div className="rounded-xl border border-teal-200 bg-teal-50 p-4">
            <p className="text-sm font-semibold text-teal-950">
              {selectedClinicName ? `Treatment request for ${selectedClinicName}` : "Treatment request for the selected clinic"}
            </p>
            <p className="mt-1 text-sm text-teal-900">
              Choose an available doctor from this clinic for your treatment request.
            </p>
          </div>
        )}

        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
          This form is not for emergencies and does not provide a diagnosis. If you may be having a medical emergency, contact local emergency services or seek urgent care.
        </div>

        {urgentAnswer && (
          <div role="alert" className="rounded-xl border border-rose-300 bg-rose-50 p-4 font-medium text-rose-950">
            Your safety-screening answers may indicate an emergency. Stop this assessment and contact local emergency services or go to the nearest emergency department now. Do not wait for an online response.
          </div>
        )}

        {doctorError && <div role="alert" className="rounded-xl bg-rose-50 p-4 text-rose-800">{doctorError}</div>}

        <ol aria-label="Assessment steps" className="grid gap-2 sm:grid-cols-3">
          {steps.map((label, index) => (
            <li
              key={label}
              aria-current={step === index + 1 ? "step" : undefined}
              className={`rounded-xl border p-3 text-sm font-semibold ${
                step === index + 1 ? "border-teal-700 bg-teal-50 text-teal-900" : "border-slate-200 bg-white text-slate-600"
              }`}
            >
              <span className="mr-2">{index + 1}.</span>{label}
            </li>
          ))}
        </ol>

        <form onSubmit={step === steps.length ? handleSubmit : handleContinue} className="space-y-5">
          {step === 1 && (
            <>
              <section className="rounded-2xl border border-slate-200 bg-white p-5">
                <label htmlFor="doctor_id" className="block text-sm font-medium text-slate-700">Doctor</label>
                <select
                  id="doctor_id"
                  required
                  disabled={Boolean(assessmentId)}
                  value={form.doctor_id}
                  onChange={(event) => setForm((current) => ({ ...current, doctor_id: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-3"
                >
                  <option value="">Select a doctor</option>
                  {doctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.name} — {doctor.specialty}{doctor.clinic_name ? `, ${doctor.clinic_name}` : ""}
                    </option>
                  ))}
                </select>
                {loadingDoctors && <p className="mt-2 text-sm text-slate-600">Loading available doctors…</p>}
                {!loadingDoctors && doctors.length === 0 && !doctorError && (
                  <p className="mt-2 text-sm text-slate-600">No verified doctors are currently available for assessment submission.</p>
                )}
              </section>
              <SymptomForm value={form} onChange={setForm} step={1} />
            </>
          )}
          {step === 2 && <SymptomForm value={form} onChange={setForm} step={2} />}
          {step === 3 && (
            <>
              <LabResultForm results={labResults} onChange={setLabResults} />
              <MedicalFileUploader files={files} onChange={setFiles} />
              {Object.entries(uploadProgress).map(([key, progress]) => (
                <p key={key} className="text-sm text-slate-600">Uploading {key.split(":")[0]}: {progress}%</p>
              ))}
              {existingFiles.length > 0 && (
                <section className="rounded-xl border border-slate-200 bg-white p-4">
                  <h3 className="font-semibold text-slate-900">Files already saved with this draft</h3>
                  <ul className="mt-2 list-disc pl-5 text-sm text-slate-700">
                    {existingFiles.map((file) => <li key={file.id}>{file.original_filename}</li>)}
                  </ul>
                </section>
              )}
              <OcrVerificationPanel />
              <AiSummaryPanel />
              <section className="rounded-2xl border border-slate-200 bg-white p-5">
                <h3 className="font-semibold text-slate-900">Before you submit</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Your information is patient-reported and will be sent to the doctor you selected for review. Uploaded files and lab entries are not automatically analyzed. Lab values are unverified until a clinician reviews them.
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  Submission date and time will be recorded when you submit. Review your entries before sending.
                </p>
              </section>
            </>
          )}

          {errorMessage && (
            <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-800">
              {errorMessage}
              {assessmentId && <p className="mt-1 text-sm">Your existing draft has not been removed. You can retry without creating another assessment.</p>}
            </div>
          )}
          {successMessage && <p role="status" className="rounded-xl bg-emerald-50 p-4 text-emerald-900">{successMessage}</p>}

          <div className="flex flex-wrap justify-between gap-3">
            <div className="flex gap-3">
              {step > 1 && (
                <Button type="button" variant="secondary" disabled={submitting} onClick={() => setStep((current) => current - 1)}>
                  Back
                </Button>
              )}
              <Button
                type="button"
                loading={submitting}
                disabled={loadingDoctors}
                onClick={handleSaveDraft}
              >
                {submitting ? "Saving…" : "Save draft"}
              </Button>
            </div>
            {step < steps.length ? (
              <Button
                type="submit"
                disabled={loadingDoctors || doctors.length === 0 || submitting}
              >
                Continue
              </Button>
            ) : (
              <Button type="submit" loading={submitting}>
                {submitting ? "Saving and submitting..." : "Submit to doctor"}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
