import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyAssessments } from "../../services/assessmentService";

const readableStatus = (status) => status.replaceAll("_", " ");

export default function AssessmentHistory() {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let active = true;
    getMyAssessments()
      .then((response) => {
        if (active) setAssessments(response.data?.data?.assessments || []);
      })
      .catch((error) => {
        if (active) setErrorMessage(error.response?.data?.message || "Unable to load your history.");
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
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-teal-800">Patient</p>
            <h2 className="text-3xl font-bold text-slate-900">Assessment history</h2>
          </div>
          <Link to="/patient/assessment/new" className="rounded-xl bg-teal-700 px-4 py-2.5 font-semibold text-white">
            New assessment
          </Link>
        </header>
        {loading && <p className="rounded-xl bg-white p-5 text-slate-600">Loading assessments…</p>}
        {errorMessage && <p role="alert" className="rounded-xl bg-rose-50 p-5 text-rose-800">{errorMessage}</p>}
        {!loading && !errorMessage && assessments.length === 0 && (
          <p className="rounded-xl bg-white p-5 text-slate-600">You have no assessments yet.</p>
        )}
        <div className="space-y-3">
          {assessments.map((assessment) => (
            <Link
              key={assessment.id}
              to={`/patient/assessments/${assessment.id}`}
              className="block rounded-2xl border border-slate-200 bg-white p-5 hover:border-teal-400"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-slate-900">{assessment.chief_complaint}</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Dr. {assessment.doctor_name} · {assessment.doctor_specialty}
                  </p>
                </div>
                <span className="rounded-full bg-teal-50 px-3 py-1 text-sm capitalize text-teal-900">
                  {readableStatus(assessment.status)}
                </span>
              </div>
              <p className="mt-3 text-xs text-slate-500">
                Created {new Date(assessment.created_at).toLocaleString()}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
