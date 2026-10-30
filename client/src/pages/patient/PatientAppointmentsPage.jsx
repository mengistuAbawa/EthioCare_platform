import { useCallback, useEffect, useState } from "react";
import EmptyState from "../../components/dashboard/EmptyState";
import ErrorState from "../../components/dashboard/ErrorState";
import LoadingState from "../../components/dashboard/LoadingState";
import { Button, FormField, PageHeader, StatusBadge } from "../../components/ui/Primitives";
import { getMyAppointments } from "../../services/patientAppointmentService";

const formatDate = (value) => new Date(value).toLocaleString();
const statusOptions = ["pending", "confirmed", "completed", "cancelled", "rejected", "no_show"];

export default function PatientAppointmentsPage({ history = false }) {
  const [appointments, setAppointments] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  const load = useCallback(async () => {
    try {
      const params = { page, limit: 20, period: history ? "history" : "upcoming" };
      if (status) params.status = status;
      const response = await getMyAppointments(params);
      setAppointments(response.data?.data?.appointments || []);
      setPagination(response.data?.data?.pagination || null);
      setError("");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load your appointments.");
    } finally {
      setLoading(false);
    }
  }, [history, page, status]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [attempt, load]);

  return (
    <section className="ui-card p-5 sm:p-6">
      <PageHeader
        title={history ? "Appointment history" : "My appointments"}
        description="Records are limited to your authenticated account. Appointment changes are not currently supported."
        className="mb-5"
      />
      <FormField id="appointment-status-filter" label="Filter by status" className="mb-4 max-w-xs">
        <select
          className="ui-control w-full text-sm"
          value={status}
          onChange={(event) => {
            setLoading(true);
            setError("");
            setPage(1);
            setStatus(event.target.value);
          }}
        >
          <option value="">All statuses</option>
          {statusOptions.map((item) => <option key={item} value={item}>{item.replaceAll("_", " ")}</option>)}
        </select>
      </FormField>

      {error && (
        <ErrorState
          message={error}
          onRetry={() => {
            setLoading(true);
            setError("");
            setAttempt((current) => current + 1);
          }}
          className="mb-4"
        />
      )}
      {loading ? <LoadingState label="Loading your appointments..." /> : appointments.length === 0 ? (
        <EmptyState
          title={history ? "No appointment history" : "No upcoming appointments"}
          description="No appointment records match this view and filter."
        />
      ) : (
        <div className="space-y-3">
          {appointments.map((appointment) => (
            <article key={appointment.id} className="rounded-xl border border-slate-200 p-4">
              <div className="flex flex-col justify-between gap-3 sm:flex-row">
                <div>
                  <h3 className="font-semibold text-slate-950">{appointment.service_name}</h3>
                  <p className="mt-1 text-sm text-slate-700">Dr. {appointment.doctor_name} · {appointment.specialty}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {appointment.clinic_name} · {appointment.city}{appointment.region ? `, ${appointment.region}` : ""}
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    {formatDate(appointment.starts_at)} · {appointment.duration_minutes} minutes
                  </p>
                </div>
                <div className="sm:text-right">
                  <StatusBadge status={appointment.status} />
                  <p className="mt-2 text-xs text-slate-500">Reference #{appointment.id}</p>
                  {appointment.cancellation_reason && (
                    <p className="mt-2 max-w-sm text-sm text-slate-600">
                      Cancellation reason: {appointment.cancellation_reason}
                    </p>
                  )}
                </div>
              </div>
            </article>
          ))}
          {pagination?.pages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
              <p className="text-sm text-slate-600">Page {pagination.page} of {pagination.pages} · {pagination.total} appointments</p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={page <= 1}
                  onClick={() => { setLoading(true); setPage((current) => current - 1); }}
                >
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={page >= pagination.pages}
                  onClick={() => { setLoading(true); setPage((current) => current + 1); }}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
