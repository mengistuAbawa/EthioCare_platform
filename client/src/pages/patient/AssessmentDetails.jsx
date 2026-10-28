import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AiSummaryPanel from "../../components/assessment/AiSummaryPanel";
import OcrVerificationPanel from "../../components/assessment/OcrVerificationPanel";
import {
  getAssessment,
  getAssessmentFileDownloadUrl,
} from "../../services/assessmentService";

const displayText = (value) => value || "Not provided";

export default function AssessmentDetails() {
  const { assessmentId } = useParams();
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let active = true;
    getAssessment(assessmentId)
      .then((response) => {
        if (active) setAssessment(response.data?.data?.assessment || null);
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
        {loading && <p className="rounded-xl bg-white p-5">Loading assessment…</p>}
        {errorMessage && <p role="alert" className="rounded-xl bg-rose-50 p-4 text-rose-800">{errorMessage}</p>}
        {assessment && (
          <>
            <header className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-sm capitalize text-teal-800">{assessment.status.replaceAll("_", " ")}</p>
              <h2 className="mt-1 text-3xl font-bold text-slate-900">{assessment.chief_complaint}</h2>
              <p className="mt-2 text-sm text-slate-600">
                Dr. {assessment.doctor_name} · {assessment.doctor_specialty}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Created {new Date(assessment.created_at).toLocaleString()}
              </p>
            </header>
            <section className="space-y-3 rounded-2xl bg-white p-5">
              <h2 className="text-lg font-semibold">Symptoms</h2>
              {assessment.symptoms?.length
                ? <ul className="list-disc space-y-1 pl-5 text-slate-700">{assessment.symptoms.map((item, index) => <li key={index}>{item}</li>)}</ul>
                : <p className="text-slate-600">No symptoms listed.</p>}
              <h3 className="font-semibold">Medical history</h3>
              <p className="whitespace-pre-wrap text-slate-700">{displayText(assessment.medical_history)}</p>
              <h3 className="font-semibold">Medications</h3>
              <p className="whitespace-pre-wrap text-slate-700">{displayText(assessment.medications)}</p>
              <h3 className="font-semibold">Allergies</h3>
              <p className="whitespace-pre-wrap text-slate-700">{displayText(assessment.allergies)}</p>
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
            <section className="rounded-2xl bg-white p-5">
              <h2 className="text-lg font-semibold">Doctor review</h2>
              <p className="mt-3 whitespace-pre-wrap text-slate-700">
                {assessment.review_notes || "Your doctor has not added review notes yet."}
              </p>
              {assessment.reviewed_at && (
                <p className="mt-2 text-xs text-slate-500">
                  Reviewed {new Date(assessment.reviewed_at).toLocaleString()}
                </p>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
