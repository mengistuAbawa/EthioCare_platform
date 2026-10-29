import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyAssessments } from "../../services/assessmentService";

const readableStatus = (status) => status.replaceAll("_", " ");

export default function AssessmentHistory() {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

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

  const filteredAssessments = assessments.filter((assessment) => {
    const submittedDate = new Date(assessment.created_at).toISOString().slice(0, 10);
    return (!statusFilter || assessment.status === statusFilter) &&
      (!fromDate || submittedDate >= fromDate) &&
      (!toDate || submittedDate <= toDate);
  });

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
        {!loading && !errorMessage && (
          <section aria-label="Filter assessment history" className="grid gap-3 rounded-2xl bg-white p-4 sm:grid-cols-3">
            <label className="text-sm font-medium text-slate-700">
              Status
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2">
                <option value="">All statuses</option>
                <option value="draft">Draft</option>
                <option value="submitted">Submitted</option>
                <option value="in_review">In review</option>
                <option value="reviewed">Reviewed by doctor</option>
              </select>
            </label>
            <label className="text-sm font-medium text-slate-700">
              From
              <input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
            </label>
            <label className="text-sm font-medium text-slate-700">
              To
              <input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
            </label>
          </section>
        )}
        {!loading && !errorMessage && assessments.length === 0 && (
          <p className="rounded-xl bg-white p-5 text-slate-600">You have no assessments yet.</p>
        )}
        <div className="space-y-3">
          {filteredAssessments.map((assessment) => (
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
          {!loading && !errorMessage && assessments.length > 0 && filteredAssessments.length === 0 && (
            <p className="rounded-xl bg-white p-5 text-slate-600">No assessments match those filters.</p>
          )}
        </div>
      </div>
    </div>
  );
}
