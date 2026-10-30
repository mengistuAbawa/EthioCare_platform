import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import EmptyState from "../../components/dashboard/EmptyState";
import ErrorState from "../../components/dashboard/ErrorState";
import LoadingState from "../../components/dashboard/LoadingState";
import { PageHeader, StatusBadge } from "../../components/ui/Primitives";
import { getDoctorAssessmentInbox } from "../../services/assessmentService";

export default function AssessmentInbox() {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [attempt, setAttempt] = useState(0);

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
  }, [attempt]);

  return (
    <div>
      <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Assessment inbox"
        description="Only assessments explicitly assigned to you appear here."
        className="mb-6"
      />
      {loading && <LoadingState label="Loading your assessment inbox..." />}
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
        {!loading && !errorMessage && assessments.length === 0 && (
        <EmptyState title="No assigned assessments" description="Submitted assessments assigned to you will appear here." />
        )}
      {!loading && !errorMessage && assessments.length > 0 && <div className="space-y-3">
          {assessments.map((assessment) => (
            <Link
              key={assessment.id}
              to={`/doctor/assessments/${assessment.id}`}
            className="ui-card block p-5 transition-colors hover:border-brand-teal"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-slate-900">{assessment.chief_complaint}</h2>
                  {assessment.patient_name && <p className="mt-1 text-sm text-slate-600">Patient: {assessment.patient_name}</p>}
                </div>
                <StatusBadge status={assessment.status} />
              </div>
              <p className="mt-3 text-xs text-slate-500">
                Submitted {assessment.submitted_at ? new Date(assessment.submitted_at).toLocaleString() : "recently"}
              </p>
            </Link>
          ))}
        </div>}
      </div>
    </div>
  );
}
