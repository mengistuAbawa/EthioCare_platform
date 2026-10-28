import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AiSummaryPanel from "../../components/assessment/AiSummaryPanel";
import OcrVerificationPanel from "../../components/assessment/OcrVerificationPanel";
import {
  getAssessment,
  getAssessmentFileDownloadUrl,
  saveAssessmentReview,
} from "../../services/assessmentService";

const showValue = (value) => value || "Not provided";

export default function AssessmentReview() {
  const { assessmentId } = useParams();
  const [assessment, setAssessment] = useState(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [status, setStatus] = useState("reviewed");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let active = true;
    getAssessment(assessmentId)
      .then((response) => {
        if (active) {
          const current = response.data?.data?.assessment || null;
          setAssessment(current);
          setReviewNotes(current?.review_notes || "");
          setStatus(current?.status === "reviewed" ? "reviewed" : "in_review");
        }
      })
      .catch((error) => {
        if (active) setErrorMessage(error.response?.data?.message || "Unable to load this assessment.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [assessmentId]);

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setErrorMessage("");
    try {
      const response = await saveAssessmentReview(assessmentId, {
        review_notes: reviewNotes,
        status,
      });
      setAssessment((current) => ({ ...current, ...response.data.data.assessment }));
      setMessage("Review saved.");
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Unable to save the review.");
    } finally {
      setSaving(false);
    }
  };

  const downloadFile = async (fileId) => {
    try {
      const response = await getAssessmentFileDownloadUrl(assessmentId, fileId);
      window.location.assign(response.data.data.url);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Unable to open the file.");
    }
  };

  return (
    <div>
      <div className="mx-auto max-w-4xl space-y-5">
        <Link to="/doctor/assessments" className="font-semibold text-teal-800 hover:underline">
          ← Assessment inbox
        </Link>
        {loading && <p className="rounded-xl bg-white p-5">Loading assessment…</p>}
        {errorMessage && <p role="alert" className="rounded-xl bg-rose-50 p-4 text-rose-800">{errorMessage}</p>}
        {assessment && (
          <>
            <header className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-sm capitalize text-violet-800">{assessment.status.replaceAll("_", " ")}</p>
              <h2 className="mt-1 text-3xl font-bold text-slate-900">{assessment.chief_complaint}</h2>
              <p className="mt-2 text-sm text-slate-600">Patient: {assessment.patient_name}</p>
              <p className="mt-1 text-xs text-slate-500">
                Submitted {assessment.submitted_at ? new Date(assessment.submitted_at).toLocaleString() : "not submitted"}
              </p>
            </header>
            <section className="space-y-3 rounded-2xl bg-white p-5">
              <h2 className="text-lg font-semibold">Symptoms and history</h2>
              {assessment.symptoms?.length
                ? <ul className="list-disc space-y-1 pl-5 text-slate-700">{assessment.symptoms.map((item, index) => <li key={index}>{item}</li>)}</ul>
                : <p className="text-slate-600">No symptoms listed.</p>}
              <h3 className="font-semibold">Medical history</h3>
              <p className="whitespace-pre-wrap text-slate-700">{showValue(assessment.medical_history)}</p>
              <h3 className="font-semibold">Medications</h3>
              <p className="whitespace-pre-wrap text-slate-700">{showValue(assessment.medications)}</p>
              <h3 className="font-semibold">Allergies</h3>
              <p className="whitespace-pre-wrap text-slate-700">{showValue(assessment.allergies)}</p>
            </section>
            <section className="rounded-2xl bg-white p-5">
              <h2 className="text-lg font-semibold">Lab results</h2>
              {assessment.lab_results?.length ? (
                <ul className="mt-3 divide-y divide-slate-100">
                  {assessment.lab_results.map((result, index) => (
                    <li key={index} className="flex flex-wrap justify-between gap-2 py-2">
                      <span>{result.name}</span>
                      <span>{result.value} {result.unit}</span>
                    </li>
                  ))}
                </ul>
              ) : <p className="mt-2 text-slate-600">No results provided.</p>}
            </section>
            <section className="rounded-2xl bg-white p-5">
              <h2 className="text-lg font-semibold">Attached files</h2>
              <ul className="mt-3 space-y-2">
                {assessment.files?.map((file) => (
                  <li key={file.id}>
                    <button
                      type="button"
                      onClick={() => downloadFile(file.id)}
                      className="font-semibold text-teal-800 underline"
                    >
                      {file.original_filename}
                    </button>
                  </li>
                ))}
                {!assessment.files?.length && <li className="text-slate-600">No files attached.</li>}
              </ul>
            </section>
            <OcrVerificationPanel status={assessment.ocr_status} />
            <AiSummaryPanel status={assessment.ai_summary_status} />
            <form onSubmit={handleSave} className="space-y-4 rounded-2xl bg-white p-5">
              <h2 className="text-lg font-semibold">Clinician review</h2>
              <p className="text-sm text-slate-600">
                Enter clinician-authored notes. Do not treat extracted or submitted information as a confirmed diagnosis.
              </p>
              <label className="block text-sm font-medium text-slate-700">
                Review notes
                <textarea
                  required
                  maxLength={10000}
                  rows={6}
                  value={reviewNotes}
                  onChange={(event) => setReviewNotes(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Review status
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                  className="mt-1 block rounded-xl border border-slate-300 bg-white px-3 py-2"
                >
                  <option value="in_review">In review</option>
                  <option value="reviewed">Reviewed</option>
                </select>
              </label>
              {message && <p role="status" className="text-emerald-800">{message}</p>}
              {errorMessage && <p role="alert" className="text-rose-800">{errorMessage}</p>}
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-teal-700 px-5 py-3 font-semibold text-white hover:bg-teal-800 disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save review"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
