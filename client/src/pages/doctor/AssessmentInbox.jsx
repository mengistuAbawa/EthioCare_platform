import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getDoctorAssessmentInbox } from "../../services/assessmentService";

export default function AssessmentInbox() {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let active = true;
    getDoctorAssessmentInbox()
      .then((response) => {
        if (active) setAssessments(response.data?.data?.assessments || []);
      })
      .catch((error) => {
        if (active) setErrorMessage(error.response?.data?.message || "Unable to load your inbox.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div>
      <div className="mx-auto max-w-4xl">
        <header className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-violet-800">Doctor</p>
          <h2 className="text-3xl font-bold text-slate-900">Assessment inbox</h2>
          <p className="mt-1 text-slate-600">Only assessments explicitly assigned to you appear here.</p>
        </header>
        {loading && <p className="rounded-xl bg-white p-5 text-slate-600">Loading inbox…</p>}
        {errorMessage && <p role="alert" className="rounded-xl bg-rose-50 p-5 text-rose-800">{errorMessage}</p>}
        {!loading && !errorMessage && assessments.length === 0 && (
          <p className="rounded-xl bg-white p-5 text-slate-600">There are no submitted assessments assigned to you.</p>
        )}
        <div className="space-y-3">
          {assessments.map((assessment) => (
            <Link
              key={assessment.id}
              to={`/doctor/assessments/${assessment.id}`}
              className="block rounded-2xl border border-slate-200 bg-white p-5 hover:border-violet-400"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-slate-900">{assessment.chief_complaint}</h2>
                  <p className="mt-1 text-sm text-slate-600">Patient: {assessment.patient_name}</p>
                </div>
                <span className="rounded-full bg-violet-50 px-3 py-1 text-sm capitalize text-violet-900">
                  {assessment.status.replaceAll("_", " ")}
                </span>
              </div>
              <p className="mt-3 text-xs text-slate-500">
                Submitted {assessment.submitted_at ? new Date(assessment.submitted_at).toLocaleString() : "recently"}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
