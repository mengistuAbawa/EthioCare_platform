import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAdminDashboard } from "../../services/systemAdminService";
import EmptyState from "../../components/dashboard/EmptyState";
import ErrorState from "../../components/dashboard/ErrorState";
import LoadingState from "../../components/dashboard/LoadingState";

const cardClass = "rounded-2xl border border-slate-200 bg-white p-5";
const displayDate = (value) => new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });

function TrendChart({ title, data = [] }) {
  const maxValue = Math.max(1, ...data.map((item) => item.count));
  const hasData = data.some((item) => item.count > 0);

  return (
    <section className={cardClass}>
      <h3 className="font-semibold text-slate-900">{title}</h3>
      {!hasData ? (
        <p className="mt-4 text-sm text-slate-500">No records were created in the last 14 days.</p>
      ) : (
        <div className="mt-5 grid h-36 grid-cols-7 items-end gap-2 sm:grid-cols-14" aria-label={`${title} over the last 14 days`}>
          {data.map((item) => (
            <div key={item.day} className="flex h-full flex-col items-center justify-end gap-1" title={`${displayDate(item.day)}: ${item.count}`}>
              <span className="text-[10px] font-medium text-slate-600">{item.count || ""}</span>
              <div
                className="w-full min-w-2 rounded-t bg-teal-600"
                style={{ height: `${Math.max(4, (item.count / maxValue) * 100)}%` }}
                aria-hidden="true"
              />
              <time className="text-[9px] text-slate-500" dateTime={item.day}>
                {new Date(item.day).getDate()}
              </time>
            </div>
          ))}
        </div>
      )}
      <p className="mt-3 text-xs text-slate-500">Daily records created · last 14 days</p>
    </section>
  );
}

export function PlatformAnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  const load = useCallback(async () => {
    try {
      const response = await getAdminDashboard();
      setData(response.data?.data || null);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load platform analytics.");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { void Promise.resolve().then(load); }, [load, attempt]);

  if (loading) return <LoadingState label="Loading platform analytics..." />;
  if (error) return <ErrorState message={error} onRetry={() => { setLoading(true); setError(""); setAttempt((current) => current + 1); }} />;
  if (!data) return <EmptyState title="Analytics unavailable" description="No analytics response was returned." />;

  const statuses = data.appointments?.by_status || [];
  const total = statuses.reduce((sum, item) => sum + item.count, 0);
  return (
    <div className="space-y-5">
      <section className={cardClass}>
        <h2 className="text-xl font-bold text-slate-950">Platform analytics</h2>
        <p className="mt-1 text-sm text-slate-600">Summary and 14-day trends calculated from stored clinic, user, and appointment records.</p>
      </section>
      <div className="grid gap-4 xl:grid-cols-2">
        <TrendChart title="Clinic registrations" data={data.trends?.clinic_registrations} />
        <TrendChart title="Appointments created" data={data.trends?.appointments_created} />
      </div>
      <section className={cardClass}>
        <h3 className="font-semibold text-slate-900">Appointment status distribution</h3>
        {total === 0 ? <p className="mt-3 text-sm text-slate-500">No appointment records exist yet.</p> : (
          <div className="mt-4 space-y-3">
            {statuses.map((status) => (
              <div key={status.status}>
                <div className="mb-1 flex justify-between text-sm"><span className="capitalize text-slate-700">{status.status.replaceAll("_", " ")}</span><span className="font-semibold text-slate-900">{status.count} ({Math.round(status.count / total * 100)}%)</span></div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-teal-600" style={{ width: `${status.count / total * 100}%` }} /></div>
              </div>
            ))}
          </div>
        )}
      </section>
      <p className="text-xs text-slate-500">Counts reflect current database records; no forecast or synthetic values are used.</p>
    </div>
  );
}

export default function SystemAdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  const load = useCallback(async () => {
    try {
      const response = await getAdminDashboard();
      setData(response.data?.data || null);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load system administration metrics.");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { void Promise.resolve().then(load); }, [load, attempt]);

  if (loading) return <LoadingState label="Loading system dashboard..." />;
  if (error) return <ErrorState message={error} onRetry={() => { setLoading(true); setError(""); setAttempt((current) => current + 1); }} />;
  if (!data) return <EmptyState title="Dashboard data unavailable" description="No dashboard summary was returned." />;

  const clinicMetrics = data.clinics || {};
  const userMetrics = data.users || {};
  const metrics = [
    ["Registered clinics", clinicMetrics.total || 0, "/admin/clinics"],
    ["Pending verification", clinicMetrics.pending || 0, "/admin/verification"],
    ["Verified clinics", clinicMetrics.verified || 0, "/admin/clinics"],
    ["Suspended clinics", clinicMetrics.suspended || 0, "/admin/clinic-status"],
    ["Active users", userMetrics.total || 0, "/admin/users"],
    ["Doctors", userMetrics.doctors || 0, "/admin/doctors"],
    ["Receptionists", userMetrics.receptionists || 0, "/admin/staff"],
    ["Appointments", data.appointments?.total || 0, "/admin/appointments"],
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <h2 className="text-xl font-bold text-slate-950">System overview</h2>
        <p className="mt-1 text-sm text-slate-600">Live counts from the clinic, user, appointment, and audit records.</p>
      </section>

      <section aria-label="Platform metrics" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(([label, value, to]) => (
          <Link key={label} to={to} className={`${cardClass} transition-colors hover:border-teal-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700`}>
            <p className="text-sm text-slate-600">{label}</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{Number(value).toLocaleString()}</p>
          </Link>
        ))}
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <TrendChart title="New clinic registrations" data={data.trends?.clinic_registrations} />
        <TrendChart title="Appointments created" data={data.trends?.appointments_created} />
      </div>

      <section className={cardClass}>
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-semibold text-slate-900">Appointment status distribution</h3>
          <Link to="/admin/appointments" className="text-sm font-semibold text-teal-800 hover:underline">View appointments</Link>
        </div>
        {data.appointments?.by_status?.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {data.appointments.by_status.map((item) => <span key={item.status} className="rounded-xl bg-slate-50 px-3 py-2 text-sm capitalize text-slate-700">{item.status.replaceAll("_", " ")} <strong className="ml-1 text-slate-950">{item.count}</strong></span>)}
          </div>
        ) : <p className="mt-3 text-sm text-slate-500">No appointments have been recorded.</p>}
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className={cardClass}>
          <div className="flex items-center justify-between gap-3"><h3 className="font-semibold text-slate-900">Recent clinic registrations</h3><Link to="/admin/clinics" className="text-sm font-semibold text-teal-800 hover:underline">All clinics</Link></div>
          {data.recent_clinics?.length ? (
            <ul className="mt-3 divide-y divide-slate-100">{data.recent_clinics.map((clinic) => (
              <li key={clinic.id} className="flex flex-col justify-between gap-2 py-3 sm:flex-row sm:items-center">
                <div><Link to={`/admin/clinics/${clinic.id}`} className="font-semibold text-slate-900 hover:text-teal-800">{clinic.name}</Link><p className="text-xs text-slate-500">{clinic.city}{clinic.region ? `, ${clinic.region}` : ""} · {clinic.created_by_name || "Owner unavailable"}</p></div>
                <div className="flex gap-2"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs capitalize text-slate-700">{clinic.verification_status}</span><span className={`rounded-full px-2.5 py-1 text-xs capitalize ${clinic.operational_status === "suspended" ? "bg-rose-50 text-rose-800" : "bg-emerald-50 text-emerald-800"}`}>{clinic.operational_status}</span></div>
              </li>
            ))}</ul>
          ) : <p className="mt-3 text-sm text-slate-500">No clinic records yet.</p>}
        </section>
        <section className={cardClass}>
          <div className="flex items-center justify-between gap-3"><h3 className="font-semibold text-slate-900">Recent administrative activity</h3><Link to="/admin/audit-logs" className="text-sm font-semibold text-teal-800 hover:underline">Audit logs</Link></div>
          {data.recent_activity?.length ? (
            <ul className="mt-3 divide-y divide-slate-100">{data.recent_activity.map((event) => (
              <li key={event.id} className="py-3"><p className="font-semibold capitalize text-slate-900">{event.action.replaceAll("_", " ")}</p><p className="text-xs text-slate-600">{event.actor_name || "Deleted account"} · {event.entity}{event.entity_id ? ` #${event.entity_id}` : ""}</p><time className="text-xs text-slate-500" dateTime={event.created_at}>{new Date(event.created_at).toLocaleString()}</time></li>
            ))}</ul>
          ) : <p className="mt-3 text-sm text-slate-500">No administrative activity recorded.</p>}
        </section>
      </div>
    </div>
  );
}
