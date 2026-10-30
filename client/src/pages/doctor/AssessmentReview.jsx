import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ErrorState from "../../components/dashboard/ErrorState";
import LoadingState from "../../components/dashboard/LoadingState";
import AiSummaryPanel from "../../components/assessment/AiSummaryPanel";
import OcrVerificationPanel from "../../components/assessment/OcrVerificationPanel";
import { Button, Card, PageHeader, StatusBadge } from "../../components/ui/Primitives";
import {
  approveTreatmentPlan,
  createTreatmentPlan,
  getAssessment,
  getAssessmentFileDownloadUrl,
  saveLabResultReview,
  saveAssessmentReview,
  updateTreatmentPlanDraft,
} from "../../services/assessmentService";

const showValue = (value) => value || "Not provided";
const emptyPlan = {
  clinical_assessment: "",
  recommendations: "",
  medication_instructions: "",
  non_medication_care: "",
  investigations: "",
  referral: "",
  warning_signs: "",
  follow_up_date: "",
  patient_explanation: "",
};
const planLabels = {
  clinical_assessment: "Clinician-authored assessment",
  recommendations: "Treatment recommendations",
  medication_instructions: "Medication instructions (if clinically indicated)",
  non_medication_care: "Non-medication care",
  investigations: "Investigations",
  referral: "Referral",
  warning_signs: "Warning signs and escalation instructions",
  patient_explanation: "Patient-facing explanation",
};

function LabReviewEditor({ assessmentId, resultIndex, result, review, onSaved }) {
  const [values, setValues] = useState(review?.reviewed_result || result);
  const [verificationStatus, setVerificationStatus] = useState(review?.verification_status || "verified");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const update = (field) => (event) => {
    setValues((current) => ({ ...current, [field]: event.target.value }));
  };

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const response = await saveLabResultReview(assessmentId, resultIndex, {
        ...values,
        verification_status: verificationStatus,
      });
      onSaved(response.data.data.lab_review);
      setMessage("Lab review saved. The patient-entered source value remains preserved.");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to save this lab review.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="mt-3 space-y-2 rounded-xl bg-slate-50 p-3">
      <p className="text-sm font-semibold">Original patient-entered value: {result.name}: {result.value} {result.unit}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        <input aria-label="Clinician-reviewed test name" maxLength={200} required value={values.name || ""} onChange={update("name")} className="rounded-lg border border-slate-300 px-3 py-2" />
        <input aria-label="Clinician-reviewed value" maxLength={500} required value={values.value || ""} onChange={update("value")} className="rounded-lg border border-slate-300 px-3 py-2" />
        <input aria-label="Clinician-reviewed unit" maxLength={80} value={values.unit || ""} onChange={update("unit")} className="rounded-lg border border-slate-300 px-3 py-2" placeholder="Unit" />
        <input aria-label="Clinician-reviewed reference interval" maxLength={200} value={values.reference_interval || ""} onChange={update("reference_interval")} className="rounded-lg border border-slate-300 px-3 py-2" placeholder="Reference interval" />
        <input aria-label="Laboratory name" maxLength={200} value={values.lab_name || ""} onChange={update("lab_name")} className="rounded-lg border border-slate-300 px-3 py-2" placeholder="Laboratory" />
        <input aria-label="Collection date" type="date" value={values.collected_at || ""} onChange={update("collected_at")} className="rounded-lg border border-slate-300 px-3 py-2" />
      </div>
      <label className="block text-sm font-medium text-slate-700">
        Review action
        <select value={verificationStatus} onChange={(event) => setVerificationStatus(event.target.value)} className="ml-2 rounded-lg border border-slate-300 bg-white px-2 py-1">
          <option value="verified">Verify as reported</option>
          <option value="corrected">Record a correction</option>
        </select>
      </label>
      {message && <p role="status" className="text-sm text-emerald-800">{message}</p>}
      {error && <p role="alert" className="text-sm text-rose-800">{error}</p>}
      <button type="submit" disabled={saving} className="rounded-lg border border-teal-700 px-3 py-2 text-sm font-semibold text-teal-800 disabled:opacity-50">
        {saving ? "Saving…" : "Save lab review"}
      </button>
    </form>
  );
}

export default function AssessmentReview() {
  const { assessmentId } = useParams();
  const [assessment, setAssessment] = useState(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [status, setStatus] = useState("reviewed");
  const [planForm, setPlanForm] = useState(emptyPlan);
  const [draftPlanId, setDraftPlanId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPlan, setSavingPlan] = useState(false);
  const [message, setMessage] = useState("");
  const [planMessage, setPlanMessage] = useState("");
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
          const draftPlan = current?.treatment_plans?.find((plan) => plan.status === "draft");
          if (draftPlan) {
            setPlanForm({ ...emptyPlan, ...draftPlan.plan_payload });
            setDraftPlanId(String(draftPlan.id));
          }
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

  const handleSaveReview = async (event) => {
    event.preventDefault();
    if (
      status === "reviewed" &&
      !window.confirm("Mark this assessment as reviewed? This creates a versioned clinician-authored review record.")
    ) return;
    setSaving(true);
    setMessage("");
    setErrorMessage("");
    try {
      const response = await saveAssessmentReview(assessmentId, { review_notes: reviewNotes, status });
      const savedReview = response.data.data.assessment;
      setAssessment((current) => ({
        ...current,
        ...savedReview,
        review_history: [savedReview, ...(current.review_history || [])],
      }));
      setMessage("Review saved as a new clinical review version.");
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Unable to save the review.");
    } finally {
      setSaving(false);
    }
  };

  const handleSavePlanDraft = async (event) => {
    event.preventDefault();
    setSavingPlan(true);
    setPlanMessage("");
    setErrorMessage("");
    try {
      const response = draftPlanId
        ? await updateTreatmentPlanDraft(assessmentId, draftPlanId, planForm)
        : await createTreatmentPlan(assessmentId, planForm);
      const plan = response.data.data.plan;
      setDraftPlanId(String(plan.id));
      setAssessment((current) => ({
        ...current,
        treatment_plans: [
          plan,
          ...(current.treatment_plans || []).filter((item) => item.id !== plan.id),
        ],
      }));
      setPlanMessage("Draft saved. It is not visible to the patient until approved.");
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Unable to save the treatment plan draft.");
    } finally {
      setSavingPlan(false);
    }
  };

  const approvePlan = async (plan) => {
    if (!window.confirm("Approve and release this clinician-authored treatment plan to the patient?")) return;
    setSavingPlan(true);
    setPlanMessage("");
    setErrorMessage("");
    try {
      const response = await approveTreatmentPlan(assessmentId, plan.id);
      const approved = response.data.data.plan;
      setDraftPlanId("");
      setAssessment((current) => ({
        ...current,
        treatment_plans: (current.treatment_plans || []).map((item) => (
          item.id === approved.id
            ? approved
            : item.status === "approved" ? { ...item, status: "superseded" } : item
        )),
      }));
      setPlanMessage("Treatment plan approved and released to the patient.");
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Unable to approve the treatment plan.");
    } finally {
      setSavingPlan(false);
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
        {loading && <LoadingState label="Loading patient assessment..." />}
        {errorMessage && <ErrorState message={errorMessage} className="mb-4" />}
        {assessment && (
          <>
            <Card as="header">
              <StatusBadge status={assessment.status} />
              <PageHeader
                title={assessment.chief_complaint}
                description={`Patient: ${assessment.patient_name}`}
                className="mt-2"
              />
              <p className="mt-1 text-xs text-slate-500">
                Submitted {assessment.submitted_at ? new Date(assessment.submitted_at).toLocaleString() : "not submitted"}
              </p>
            </Card>

            <section className="ui-card space-y-3 p-5">
              <h2 className="text-lg font-semibold">Patient-reported symptoms and history</h2>
              {assessment.symptoms?.length
                ? <ul className="list-disc space-y-1 pl-5 text-slate-700">{assessment.symptoms.map((item, index) => <li key={index}>{item}</li>)}</ul>
                : <p className="text-slate-600">No symptoms listed.</p>}
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div><dt className="font-semibold">Onset</dt><dd>{showValue(assessment.symptom_onset)}</dd></div>
                <div><dt className="font-semibold">Duration</dt><dd>{showValue(assessment.symptom_duration)}</dd></div>
                <div><dt className="font-semibold">Frequency</dt><dd>{showValue(assessment.symptom_frequency)}</dd></div>
                <div><dt className="font-semibold">Severity</dt><dd>{assessment.severity === null ? "Not provided" : `${assessment.severity} / 10`}</dd></div>
                <div><dt className="font-semibold">Trend</dt><dd>{showValue(assessment.symptom_trend)}</dd></div>
              </dl>
              <h3 className="font-semibold">Medical history</h3>
              <p className="whitespace-pre-wrap text-slate-700">{showValue(assessment.medical_history)}</p>
              <h3 className="font-semibold">Current medications</h3>
              <p className="whitespace-pre-wrap text-slate-700">{showValue(assessment.medications)}</p>
              <h3 className="font-semibold">Allergies</h3>
              <p className="whitespace-pre-wrap text-slate-700">{showValue(assessment.allergies)}</p>
              <h3 className="font-semibold">Previous treatment</h3>
              <p className="whitespace-pre-wrap text-slate-700">{showValue(assessment.previous_treatment)}</p>
              <h3 className="font-semibold">Additional notes</h3>
              <p className="whitespace-pre-wrap text-slate-700">{showValue(assessment.additional_notes)}</p>
              <h3 className="font-semibold">Safety screening — patient-reported</h3>
              {Object.entries(assessment.safety_answers || {}).filter(([, answer]) => answer === "yes").length > 0
                ? <ul className="list-disc pl-5 text-rose-800">{Object.entries(assessment.safety_answers || {}).filter(([, answer]) => answer === "yes").map(([key]) => <li key={key}>{key.replaceAll("_", " ")}</li>)}</ul>
                : <p className="text-slate-600">No listed warning signs were reported in the submitted screening.</p>}
            </section>

            <section className="ui-card p-5">
              <h2 className="text-lg font-semibold">Patient-entered lab values and clinician review</h2>
              {assessment.lab_results?.length ? (
                <ul className="mt-3 divide-y divide-slate-100">
                  {assessment.lab_results.map((result, index) => {
                    const review = assessment.lab_reviews?.find((item) => Number(item.result_index) === index);
                    return (
                      <li key={index} className="py-3">
                        <div className="flex flex-wrap justify-between gap-2">
                          <span>
                            {result.name}
                            {result.reference_interval && <span className="block text-xs text-slate-600">Reported reference interval: {result.reference_interval}</span>}
                          </span>
                          <span>
                            Original: {result.value} {result.unit}
                            {review && <span className="block text-xs text-emerald-800">Clinician-{review.verification_status} by {review.reviewer_name || assessment.doctor_name}</span>}
                          </span>
                        </div>
                        <LabReviewEditor
                          assessmentId={assessmentId}
                          resultIndex={index}
                          result={result}
                          review={review}
                          onSaved={(savedReview) => setAssessment((current) => ({
                            ...current,
                            lab_reviews: [
                              { ...savedReview, reviewer_name: assessment.doctor_name },
                              ...(current.lab_reviews || []),
                            ],
                          }))}
                        />
                        {(assessment.lab_reviews || []).filter((item) => Number(item.result_index) === index).length > 1 && (
                          <details className="mt-2 text-sm text-slate-700">
                            <summary className="cursor-pointer font-semibold">Previous lab review versions</summary>
                            <ol className="mt-2 space-y-2 pl-5">
                              {(assessment.lab_reviews || [])
                                .filter((item) => Number(item.result_index) === index)
                                .map((item) => (
                                  <li key={`${item.result_index}-${item.version}`}>
                                    Version {item.version} — {item.verification_status} by {item.reviewer_name} on {new Date(item.created_at).toLocaleString()}: {item.reviewed_result.value} {item.reviewed_result.unit}
                                  </li>
                                ))}
                            </ol>
                          </details>
                        )}
                      </li>
                    );
                  })}
                </ul>
              ) : <p className="mt-2 text-slate-600">No results provided.</p>}
            </section>

            <section className="ui-card p-5">
              <h2 className="text-lg font-semibold">Original uploaded files</h2>
              <ul className="mt-3 space-y-2">
                {assessment.files?.map((file) => (
                  <li key={file.id}>
                    <button type="button" onClick={() => downloadFile(file.id)} className="font-semibold text-teal-800 underline">
                      {file.original_filename}
                    </button>
                    <span className="ml-2 text-sm text-slate-500">{file.upload_status}</span>
                  </li>
                ))}
                {!assessment.files?.length && <li className="text-slate-600">No files attached.</li>}
              </ul>
            </section>

            <OcrVerificationPanel status={assessment.ocr_status} />
            <AiSummaryPanel status={assessment.ai_summary_status} />

            <form onSubmit={handleSaveReview} className="ui-card space-y-4 p-5">
              <h2 className="text-lg font-semibold">Clinician-authored review</h2>
              <p className="text-sm text-slate-600">
                Record your clinical review. Patient-reported data and any future machine-generated information are not confirmed findings.
              </p>
              <label className="block text-sm font-medium text-slate-700">
                Review notes
                <textarea required maxLength={10000} rows={6} value={reviewNotes} onChange={(event) => setReviewNotes(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Review status
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                  disabled={assessment.status === "reviewed"}
                  className="mt-1 block rounded-xl border border-slate-300 bg-white px-3 py-2"
                >
                  <option value="in_review">In review</option>
                  <option value="reviewed">Reviewed</option>
                </select>
              </label>
              {message && <p role="status" className="text-emerald-800">{message}</p>}
              <Button type="submit" loading={saving}>
                {saving ? "Saving…" : status === "reviewed" ? "Confirm and save reviewed note" : "Save review"}
              </Button>
            </form>

            {assessment.review_history?.length > 0 && (
              <section className="ui-card p-5">
                <h2 className="text-lg font-semibold">Clinical review history</h2>
                <ol className="mt-3 space-y-3">
                  {assessment.review_history.map((version) => (
                    <li key={version.version} className="rounded-xl border border-slate-200 p-3">
                      <p className="text-sm font-semibold">Version {version.version} · {version.status.replaceAll("_", " ")}</p>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{version.review_notes}</p>
                      <p className="mt-1 text-xs text-slate-500">{new Date(version.created_at).toLocaleString()}</p>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            <section className="ui-card space-y-4 p-5">
              <div>
                <h2 className="text-lg font-semibold">Doctor-directed treatment plan</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Enter only clinician-decided recommendations. This system does not generate prescriptions or perform medication allergy and interaction checks.
                </p>
              </div>
              {assessment.status !== "reviewed" && (
                <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
                  Complete and save the clinician review before creating a treatment plan.
                </p>
              )}
              <form onSubmit={handleSavePlanDraft} className="space-y-3">
                {Object.entries(planLabels).map(([field, label]) => (
                  <label key={field} className="block text-sm font-medium text-slate-700">
                    {label}
                    <textarea
                      required={["clinical_assessment", "recommendations", "patient_explanation"].includes(field)}
                      disabled={assessment.status !== "reviewed"}
                      maxLength={5000}
                      rows={field === "clinical_assessment" || field === "recommendations" ? 3 : 2}
                      value={planForm[field] || ""}
                      onChange={(event) => setPlanForm((current) => ({ ...current, [field]: event.target.value }))}
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
                    />
                  </label>
                ))}
                <label className="block text-sm font-medium text-slate-700">
                  Follow-up date (optional)
                  <input
                    type="date"
                    disabled={assessment.status !== "reviewed"}
                    value={planForm.follow_up_date || ""}
                    onChange={(event) => setPlanForm((current) => ({ ...current, follow_up_date: event.target.value }))}
                    className="mt-1 block rounded-xl border border-slate-300 px-3 py-2"
                  />
                </label>
                {planMessage && <p role="status" className="text-sm text-emerald-800">{planMessage}</p>}
                <Button type="submit" variant="secondary" loading={savingPlan} disabled={assessment.status !== "reviewed"}>
                  {savingPlan ? "Saving…" : "Save treatment plan draft"}
                </Button>
              </form>
              <div className="space-y-2 border-t border-slate-100 pt-4">
                <h3 className="font-semibold">Plan versions</h3>
                {(assessment.treatment_plans || []).map((plan) => (
                  <div key={plan.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-3">
                    <span className="text-sm">Version {plan.version} · {plan.status.replaceAll("_", " ")}</span>
                    {plan.status === "draft" && (
                      <Button type="button" loading={savingPlan} onClick={() => approvePlan(plan)}>
                        Approve and release
                      </Button>
                    )}
                  </div>
                ))}
                {(assessment.treatment_plans || []).length === 0 && <p className="text-sm text-slate-600">No plan has been created.</p>}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
