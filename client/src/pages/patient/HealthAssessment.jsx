import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  createAssessment,
  getPublicAssessmentDoctors,
  submitAssessment,
  uploadAssessmentFile,
} from "../../services/assessmentService";
import AiSummaryPanel from "../../components/assessment/AiSummaryPanel";
import LabResultForm from "../../components/assessment/LabResultForm";
import MedicalFileUploader from "../../components/assessment/MedicalFileUploader";
import OcrVerificationPanel from "../../components/assessment/OcrVerificationPanel";
import SymptomForm from "../../components/assessment/SymptomForm";

const fileKey = (file) => `${file.name}:${file.size}:${file.lastModified}`;

export default function HealthAssessment() {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [doctorError, setDoctorError] = useState("");
  const [form, setForm] = useState({
    doctor_id: "",
    chief_complaint: "",
    symptoms: "",
    medical_history: "",
    medications: "",
    allergies: "",
  });
  const [labResults, setLabResults] = useState([]);
  const [files, setFiles] = useState([]);
  const [assessmentId, setAssessmentId] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let active = true;
    getPublicAssessmentDoctors()
      .then((response) => {
        if (active) setDoctors(response.data?.data?.doctors || []);
      })
      .catch((error) => {
        if (active) {
          setDoctorError(error.response?.data?.message || "Unable to load available doctors.");
        }
      })
      .finally(() => {
        if (active) setLoadingDoctors(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (files.some((file) => file.size > 8 * 1024 * 1024)) {
      setErrorMessage("Remove files larger than 8 MB before submitting.");
      return;
    }
    setSubmitting(true);
    setErrorMessage("");
    try {
      let id = assessmentId;
      if (!id) {
        const response = await createAssessment({
          doctor_id: form.doctor_id,
          chief_complaint: form.chief_complaint,
          symptoms: form.symptoms.split(/\r?\n/).map((item) => item.trim()).filter(Boolean),
          medical_history: form.medical_history,
          medications: form.medications,
          allergies: form.allergies,
          lab_results: labResults.filter((item) => item.name.trim()),
        });
        id = String(response.data.data.assessment.id);
        setAssessmentId(id);
      }

      const completedFiles = new Set(uploadedFiles);
      for (const file of files) {
        const key = fileKey(file);
        if (completedFiles.has(key)) continue;
        await uploadAssessmentFile(id, file);
        completedFiles.add(key);
        setUploadedFiles(new Set(completedFiles));
      }

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

  return (
    <div>
      <div className="mx-auto max-w-4xl space-y-5">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-teal-800">Patient</p>
            <h2 className="text-3xl font-bold text-slate-900">Health assessment</h2>
            <p className="mt-1 text-slate-600">Share information with the doctor you select.</p>
          </div>
          <Link to="/patient/assessments" className="font-semibold text-teal-800 hover:underline">
            View assessment history
          </Link>
        </header>

        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
          This form is not for emergencies and does not provide a diagnosis. If you may be having a
          medical emergency, contact local emergency services or seek urgent care.
        </div>

        {doctorError && (
          <div role="alert" className="rounded-xl bg-rose-50 p-4 text-rose-800">
            {doctorError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <label htmlFor="doctor_id" className="block text-sm font-medium text-slate-700">
              Doctor
            </label>
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
                  {doctor.name} — {doctor.specialty}
                  {doctor.clinic_name ? `, ${doctor.clinic_name}` : ""}
                </option>
              ))}
            </select>
            {loadingDoctors && <p className="mt-2 text-sm text-slate-600">Loading available doctors…</p>}
            {!loadingDoctors && doctors.length === 0 && !doctorError && (
              <p className="mt-2 text-sm text-slate-600">
                No verified doctors are currently available for assessment submission.
              </p>
            )}
          </section>

          <SymptomForm
            value={form}
            onChange={setForm}
            disabled={Boolean(assessmentId)}
          />
          <LabResultForm
            results={labResults}
            onChange={setLabResults}
            disabled={Boolean(assessmentId)}
          />
          <MedicalFileUploader files={files} onChange={setFiles} />
          <OcrVerificationPanel />
          <AiSummaryPanel />

          {errorMessage && (
            <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-800">
              {errorMessage}
              {assessmentId && (
                <p className="mt-1 text-sm">
                  Your draft is saved. You can retry this submission without creating another assessment.
                </p>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || loadingDoctors || doctors.length === 0}
            className="w-full rounded-xl bg-teal-700 px-5 py-3 font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Saving and submitting..." : "Submit to doctor"}
          </button>
        </form>
      </div>
    </div>
  );
}
