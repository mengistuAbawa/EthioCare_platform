import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import EmptyState from "../../components/dashboard/EmptyState";
import ErrorState from "../../components/dashboard/ErrorState";
import LoadingState from "../../components/dashboard/LoadingState";
import { FormField, PageHeader, StatusBadge } from "../../components/ui/Primitives";
import { getMyAssessments } from "../../services/assessmentService";

export default function AssessmentHistory() {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [attempt, setAttempt] = useState(0);

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
  }, [attempt]);

  const filteredAssessments = assessments.filter((assessment) => {
    const parsedDate = new Date(assessment.created_at);
    if (Number.isNaN(parsedDate.getTime())) return false;
    const submittedDate = parsedDate.toISOString().slice(0, 10);
    return (!statusFilter || assessment.status === statusFilter) &&
      (!fromDate || submittedDate >= fromDate) &&
      (!toDate || submittedDate <= toDate);
  });

  return (
    <div>
      <div className="mx-auto max-w-4xl">
        <PageHeader
          title="Assessment history"
          description="Review patient-reported assessments and doctor-authored updates."
          actions={<Link to="/patient/assessment/new" className="ui-button ui-button-primary">New assessment</Link>}
          className="mb-6"
        />
        {loading && <LoadingState label="Loading assessments..." />}
        {errorMessage && (
          <ErrorState
            message={errorMessage}
            onRetry={() => {
              setLoading(true);
              setErrorMessage("");
              setAttempt((current) => current + 1);
            }}
            className="mb-4"
          />
        )}
        {!loading && !errorMessage && (
          <section aria-label="Filter assessment history" className="ui-card mb-5 grid gap-3 p-4 sm:grid-cols-3">
            <FormField id="assessment-status-filter" label="Status">
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="ui-control w-full">
                <option value="">All statuses</option>
                <option value="draft">Draft</option>
                <option value="submitted">Submitted</option>
                <option value="in_review">In review</option>
                <option value="reviewed">Reviewed by doctor</option>
              </select>
            </FormField>
            <FormField id="assessment-from-date" label="From">
              <input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} className="ui-control w-full" />
            </FormField>
            <FormField id="assessment-to-date" label="To">
              <input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} className="ui-control w-full" />
            </FormField>
          </section>
        )}
        {!loading && !errorMessage && assessments.length === 0 && (
          <EmptyState
            title="No assessments yet"
            description="When you submit a health assessment, it will appear here."
            action={<Link to="/patient/assessment/new" className="ui-button ui-button-primary">Start an assessment</Link>}
          />
        )}
        {!loading && !errorMessage && assessments.length > 0 && <div className="space-y-3">
          {filteredAssessments.map((assessment) => (
            <Link
              key={assessment.id}
              to={`/patient/assessments/${assessment.id}`}
              className="ui-card block p-5 transition-colors hover:border-brand-teal"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-slate-900">{assessment.chief_complaint}</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    {assessment.doctor_name ? `Dr. ${assessment.doctor_name}` : "Doctor"}{assessment.doctor_specialty ? ` · ${assessment.doctor_specialty}` : ""}
                  </p>
                </div>
                <StatusBadge status={assessment.status} />
              </div>
              <p className="mt-3 text-xs text-slate-500">
                Created {new Date(assessment.created_at).toLocaleString()}
              </p>
            </Link>
          ))}
          {!loading && !errorMessage && assessments.length > 0 && filteredAssessments.length === 0 && (
            <EmptyState title="No matching assessments" description="Change or clear the filters to see more results." />
          )}
        </div>}
      </div>
    </div>
  );
}
