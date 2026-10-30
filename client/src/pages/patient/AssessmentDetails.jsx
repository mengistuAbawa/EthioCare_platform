import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ErrorState from "../../components/dashboard/ErrorState";
import LoadingState from "../../components/dashboard/LoadingState";
import { Card, PageHeader, StatusBadge } from "../../components/ui/Primitives";
import AiSummaryPanel from "../../components/assessment/AiSummaryPanel";
import OcrVerificationPanel from "../../components/assessment/OcrVerificationPanel";
import {
  getAssessment,
  getAssessmentFileDownloadUrl,
  getPatientTreatmentPlan,
} from "../../services/assessmentService";

const displayText = (value) => value || "Not provided";

export default function AssessmentDetails() {
  const { assessmentId } = useParams();
  const [assessment, setAssessment] = useState(null);
  const [treatmentPlan, setTreatmentPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([getAssessment(assessmentId), getPatientTreatmentPlan(assessmentId)])
      .then(([assessmentResponse, planResponse]) => {
        if (active) {
          setAssessment(assessmentResponse.data?.data?.assessment || null);
          setTreatmentPlan(planResponse.data?.data?.plan || null);
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
        <Link to="/patient/assessments" className="font-semibold text-teal-800 hover:underline">
          ← Assessment history
        </Link>
        {loading && <LoadingState label="Loading assessment..." />}
        {errorMessage && <ErrorState message={errorMessage} className="mb-4" />}
        {assessment && (
          <>
            <Card as="header">
              <StatusBadge status={assessment.status} />
              <PageHeader
                title={assessment.chief_complaint}
                description={`Dr. ${assessment.doctor_name} · ${assessment.doctor_specialty}`}
                className="mt-2"
              />
              {assessment.status === "draft" && (
                <Link
                  to={`/patient/assessment/${assessment.id}/edit`}
                  className="ui-button ui-button-primary mt-3"
                >
                  Continue editing draft
                </Link>
              )}
              <p className="mt-1 text-xs text-slate-500">
                Created {new Date(assessment.created_at).toLocaleString()}
              </p>
            </Card>
            <section className="ui-card space-y-3 p-5">
              <h2 className="text-lg font-semibold">Patient-reported symptoms</h2>
              {assessment.symptoms?.length
                ? <ul className="list-disc space-y-1 pl-5 text-slate-700">{assessment.symptoms.map((item, index) => <li key={index}>{item}</li>)}</ul>
                : <p className="text-slate-600">No symptoms listed.</p>}
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div><dt className="font-semibold">Onset</dt><dd>{displayText(assessment.symptom_onset)}</dd></div>
                <div><dt className="font-semibold">Duration</dt><dd>{displayText(assessment.symptom_duration)}</dd></div>
                <div><dt className="font-semibold">Frequency</dt><dd>{displayText(assessment.symptom_frequency)}</dd></div>
                <div><dt className="font-semibold">Severity</dt><dd>{assessment.severity === null ? "Not provided" : `${assessment.severity} / 10`}</dd></div>
                <div><dt className="font-semibold">Trend</dt><dd>{displayText(assessment.symptom_trend)}</dd></div>
              </dl>
              <h3 className="font-semibold">Medical history</h3>
              <p className="whitespace-pre-wrap text-slate-700">{displayText(assessment.medical_history)}</p>
              <h3 className="font-semibold">Medications</h3>
              <p className="whitespace-pre-wrap text-slate-700">{displayText(assessment.medications)}</p>
              <h3 className="font-semibold">Allergies</h3>
              <p className="whitespace-pre-wrap text-slate-700">{displayText(assessment.allergies)}</p>
              <h3 className="font-semibold">Previous treatment</h3>
              <p className="whitespace-pre-wrap text-slate-700">{displayText(assessment.previous_treatment)}</p>
              <h3 className="font-semibold">Additional notes</h3>
              <p className="whitespace-pre-wrap text-slate-700">{displayText(assessment.additional_notes)}</p>
            </section>
            <section className="ui-card p-5">
              <h2 className="text-lg font-semibold">Lab results</h2>
              {assessment.lab_results?.length ? (
                <ul className="mt-3 divide-y divide-slate-100">
                  {assessment.lab_results.map((result, index) => (
                    <li key={index} className="space-y-1 py-3">
                      {(() => {
                        const review = assessment.lab_reviews?.find((item) => Number(item.result_index) === index);
                        return (
                          <>
                            <div className="flex flex-wrap justify-between gap-2">
                              <span>{result.name}</span>
                              <span className="text-right">
                                Original: {result.value} {result.unit}
                                <span className={`block text-xs ${review ? "text-emerald-800" : "text-amber-800"}`}>
                                  {review ? `Clinician-${review.verification_status} by ${review.reviewer_name}` : "Patient-entered — unverified"}
                                </span>
                              </span>
                            </div>
                            {result.reference_interval && <p className="text-sm text-slate-600">Reported reference interval: {result.reference_interval}</p>}
                            {review && (
                              <p className="text-sm text-slate-800">
                                Clinician-reviewed value: {review.reviewed_result.name}: {review.reviewed_result.value} {review.reviewed_result.unit}
                                {review.reviewed_result.reference_interval ? ` · Reported interval: ${review.reviewed_result.reference_interval}` : ""}
                                <span className="block text-xs text-slate-500">Reviewed {new Date(review.created_at).toLocaleString()}</span>
                              </p>
                            )}
                          </>
                        );
                      })()}
                    </li>
                  ))}
                </ul>
              ) : <p className="mt-2 text-slate-600">No results provided.</p>}
            </section>
            <section className="ui-card p-5">
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
            <section className="ui-card p-5">
              <h2 className="text-lg font-semibold">Clinician-authored review</h2>
              <p className="mt-3 whitespace-pre-wrap text-slate-700">
                {assessment.review_notes || "Your doctor has not added review notes yet."}
              </p>
              {assessment.reviewed_at && (
                <p className="mt-2 text-xs text-slate-500">
                  Reviewed {new Date(assessment.reviewed_at).toLocaleString()}
                </p>
              )}
            </section>
            {treatmentPlan && (
              <section className="ui-card space-y-3 border-success/30 p-5">
                <div>
                  <p className="text-sm font-semibold text-emerald-800">Doctor-approved plan</p>
                  <h2 className="text-xl font-bold text-slate-900">Your care plan</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Approved by Dr. {treatmentPlan.doctor_name} on {new Date(treatmentPlan.approved_at).toLocaleString()}.
                  </p>
                </div>
                {Object.entries({
                  "Clinical assessment": treatmentPlan.plan_payload.clinical_assessment,
                  "Recommendations": treatmentPlan.plan_payload.recommendations,
                  "Medication instructions": treatmentPlan.plan_payload.medication_instructions,
                  "Non-medication care": treatmentPlan.plan_payload.non_medication_care,
                  "Investigations": treatmentPlan.plan_payload.investigations,
                  "Referral": treatmentPlan.plan_payload.referral,
                  "Warning signs": treatmentPlan.plan_payload.warning_signs,
                  "Patient explanation": treatmentPlan.plan_payload.patient_explanation,
                }).filter(([, value]) => value).map(([label, value]) => (
                  <div key={label}>
                    <h3 className="font-semibold text-slate-900">{label}</h3>
                    <p className="whitespace-pre-wrap text-slate-700">{value}</p>
                  </div>
                ))}
                <p className="text-sm text-slate-700">
                  Follow-up: {treatmentPlan.plan_payload.follow_up_date || "Not specified"}
                </p>
                <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-950">
                  Medication allergy and interaction checking is not available in this system. Contact your clinician or pharmacist if you have medication-safety concerns.
                </p>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
