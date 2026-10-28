import { useCallback, useEffect, useState } from "react";
import EmptyState from "../../components/dashboard/EmptyState";
import ErrorState from "../../components/dashboard/ErrorState";
import LoadingState from "../../components/dashboard/LoadingState";
import { getMyAppointments } from "../../services/patientAppointmentService";

const panelClass = "rounded-2xl border border-slate-200 bg-white p-5 sm:p-6";
const buttonClass = "inline-flex min-h-10 items-center justify-center rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:cursor-not-allowed disabled:opacity-60";
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
    <section className={panelClass}>
      <div className="mb-5">
        <h2 className="text-xl font-bold text-slate-950">{history ? "Appointment History" : "My Appointments"}</h2>
        <p className="mt-1 text-sm text-slate-600">
          Records are limited to your authenticated account. Appointment changes are not currently supported.
        </p>
      </div>
      <label className="mb-4 block max-w-xs">
        <span className="sr-only">Filter appointments by status</span>
        <select
          className="min-h-11 w-full rounded-xl border border-slate-300 px-3 text-sm focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-100"
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
      </label>

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
                  <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-700">
                    {appointment.status.replaceAll("_", " ")}
                  </span>
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
                <button
                  type="button"
                  className={buttonClass}
                  disabled={page <= 1}
                  onClick={() => { setLoading(true); setPage((current) => current - 1); }}
                >
                  Previous
                </button>
                <button
                  type="button"
                  className={buttonClass}
                  disabled={page >= pagination.pages}
                  onClick={() => { setLoading(true); setPage((current) => current + 1); }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
