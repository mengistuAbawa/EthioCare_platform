import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarClock,
  CalendarDays,
  CheckCheck,
  ClipboardList,
  FileText,
  Search,
  Users,
} from "lucide-react";
import EmptyState from "../../components/dashboard/EmptyState";
import ErrorState from "../../components/dashboard/ErrorState";
import LoadingState from "../../components/dashboard/LoadingState";
import {
  getDoctorAppointments,
  getDoctorDashboard,
  getDoctorNotifications,
  getDoctorPatients,
  getDoctorSchedule,
  getDoctorServices,
  markAllDoctorNotificationsRead,
  markDoctorNotificationRead,
} from "../../services/doctorPortalService";

const cardClass = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6";
const inputClass = "mt-1 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20";
const todayInClinic = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Addis_Ababa" }).format(new Date());
const formatDateTime = (value) => new Intl.DateTimeFormat("en-ET", {
  timeZone: "Africa/Addis_Ababa",
  dateStyle: "medium",
  timeStyle: "short",
}).format(new Date(value));

const titles = {
  dashboard: "Clinical overview",
  schedule: "My schedule",
  appointments: "My appointments",
  patients: "My patients",
  files: "Medical images & reports",
  labs: "Lab results review",
  notes: "Clinical notes",
  records: "Medical records",
  consultations: "Live consultation",
  treatment: "Prescriptions & care plans",
  followups: "Follow-up management",
  services: "My services",
  notifications: "Notifications",
  settings: "Settings",
};

function AppointmentTable({ appointments }) {
  if (!appointments.length) {
    return <EmptyState title="No appointments found" description="No appointments match this date range and filter." />;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[700px] text-left text-sm">
        <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-3 py-3">Date & time</th>
            <th className="px-3 py-3">Patient</th>
            <th className="px-3 py-3">Clinic / service</th>
            <th className="px-3 py-3">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {appointments.map((appointment) => (
            <tr key={appointment.id}>
              <td className="whitespace-nowrap px-3 py-4 font-medium text-slate-900">{formatDateTime(appointment.starts_at)}</td>
              <td className="px-3 py-4">
                <p className="font-semibold text-slate-900">{appointment.patient_name}</p>
                {appointment.patient_phone && <p className="mt-1 text-slate-500">{appointment.patient_phone}</p>}
                {appointment.reason && <p className="mt-1 max-w-xs text-xs text-slate-500">{appointment.reason}</p>}
              </td>
              <td className="px-3 py-4">
                <p className="font-medium text-slate-900">{appointment.clinic_name}</p>
                <p className="mt-1 text-slate-500">{appointment.service_name}</p>
              </td>
              <td className="px-3 py-4">
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold capitalize text-slate-700">
                  {appointment.status.replaceAll("_", " ")}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Unavailable({ title, children }) {
  return (
    <section className={cardClass}>
      <h2 className="text-xl font-bold text-slate-950">{title}</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{children}</p>
      <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
        This feature is not enabled. No sample or simulated clinical records are shown.
      </p>
    </section>
  );
}

export default function DoctorPortalPage({ page = "dashboard" }) {
  const [date, setDate] = useState(todayInClinic);
  const [toDate, setToDate] = useState(todayInClinic);
  const [data, setData] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [pageNumber, setPageNumber] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      let response;
      if (page === "dashboard") response = await getDoctorDashboard(date);
      else if (page === "appointments") {
        response = await getDoctorAppointments({ from: date, to: toDate, status: statusFilter || undefined });
      } else if (page === "schedule") response = await getDoctorSchedule({ from: date, to: toDate });
      else if (page === "patients") {
        response = await getDoctorPatients({ search: searchText, page: pageNumber });
      } else if (page === "services") response = await getDoctorServices();
      else if (page === "notifications") response = await getDoctorNotifications({ page: pageNumber, limit: 20 });
      else return;
      setData(response.data?.data || null);
    } catch (loadError) {
      setError(loadError.response?.data?.message || "Unable to load doctor portal data.");
    } finally {
      setLoading(false);
    }
  }, [date, page, pageNumber, searchText, statusFilter, toDate]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load, refresh]);

  const appointments = useMemo(() => (data?.appointments || []).filter((item) => {
    const query = searchText.trim().toLowerCase();
    return !query || [item.patient_name, item.clinic_name, item.service_name]
      .some((value) => String(value || "").toLowerCase().includes(query));
  }), [data, searchText]);

  const markRead = async (id) => {
    try {
      await markDoctorNotificationRead(id);
      setRefresh((current) => current + 1);
      window.dispatchEvent(new Event("ethiocare:notifications-updated"));
    } catch (markError) {
      setError(markError.response?.data?.message || "Unable to update the notification.");
    }
  };

  const markAllRead = async () => {
    try {
      await markAllDoctorNotificationsRead();
      setRefresh((current) => current + 1);
      window.dispatchEvent(new Event("ethiocare:notifications-updated"));
    } catch (markError) {
      setError(markError.response?.data?.message || "Unable to update notifications.");
    }
  };

  if (["assessments"].includes(page)) {
    return <Link className="sr-only" to="/doctor/assessments">Open assigned health assessment inbox</Link>;
  }
  if (page === "files") {
    return <Unavailable title={titles[page]}>
      Authorized assessment attachments are available from the assigned assessment inbox, where each download is checked against the assigned doctor. The application has no separate medical file or report catalog.
      <Link className="ml-1 font-semibold text-teal-800 underline" to="/doctor/assessments">Open assessment inbox</Link>
    </Unavailable>;
  }
  if (page === "labs") {
    return <Unavailable title={titles[page]}>
      Patients may submit lab values as part of an assigned health assessment, but the system has no verified lab-result model or review workflow. Submitted values are not treated as verified results.
      <Link className="ml-1 font-semibold text-teal-800 underline" to="/doctor/assessments">Review submitted assessment information</Link>
    </Unavailable>;
  }
  if (page === "notes") {
    return <Unavailable title={titles[page]}>The current database has no encounter or clinical-note model, signing workflow, or amendment history.</Unavailable>;
  }
  if (page === "records") {
    return <Unavailable title={titles[page]}>There is no longitudinal medical-record model. Assigned health assessments remain available through the existing assessment workflow.</Unavailable>;
  }
  if (page === "consultations") {
    return <Unavailable title={titles[page]}>No LiveKit or other live-consultation provider is configured, and the application has no secure consultation-room token workflow.</Unavailable>;
  }
  if (page === "treatment") {
    return <Unavailable title={titles[page]}>The application has no prescription or care-plan model, medication catalog, or authorization workflow. No prescriptions are created here.</Unavailable>;
  }
  if (page === "followups") {
    return <Unavailable title={titles[page]}>The database has no follow-up task model or reminder workflow.</Unavailable>;
  }
  if (page === "settings") {
    return <Unavailable title={titles[page]}>Doctor-specific preferences are not persisted by the current application. Professional profile details can be edited from the profile page.</Unavailable>;
  }

  return (
    <div className="space-y-5">
      <header className={cardClass}>
        <p className="text-sm font-semibold text-teal-800">Doctor Portal · Clinical Care &amp; Patient Follow-up</p>
        <h2 className="mt-1 text-2xl font-bold text-slate-950">{titles[page] || "Doctor workspace"}</h2>
        <p className="mt-1 text-sm text-slate-600">Information is limited to your active doctor profile and assigned patient relationships.</p>
      </header>

      {(page === "dashboard" || page === "appointments" || page === "schedule") && (
        <div className={`${cardClass} grid gap-3 sm:grid-cols-2`}>
          <label className="text-sm font-semibold text-slate-700">From
            <input className={inputClass} type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          </label>
          <label className="text-sm font-semibold text-slate-700">To
            <input className={inputClass} type="date" min={date} value={toDate} onChange={(event) => setToDate(event.target.value)} />
          </label>
        </div>
      )}

      {error && <ErrorState message={error} onRetry={() => setRefresh((current) => current + 1)} />}
      {loading && <LoadingState label={`Loading ${titles[page]?.toLowerCase() || "doctor data"}...`} />}

      {!loading && page === "dashboard" && data && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ["Today's appointments", data.stats.today_appointments, CalendarDays],
              ["Upcoming appointments", data.stats.upcoming_appointments, CalendarClock],
              ["Completed consultations", data.stats.completed_appointments, CheckCheck],
              ["Pending assessments", data.stats.pending_assessments, ClipboardList],
              ["Unread notifications", data.stats.unread_notifications, FileText],
            ].map(([label, count, Icon]) => (
              <article key={label} className={`${cardClass} flex items-center gap-4`}>
                <span className="rounded-xl bg-teal-50 p-3 text-teal-800"><Icon size={20} aria-hidden="true" /></span>
                <div><p className="text-sm text-slate-500">{label}</p><p className="text-2xl font-bold text-slate-950">{count}</p></div>
              </article>
            ))}
          </div>
          <section className={cardClass}>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-bold text-slate-950">Today's appointments</h3>
              <Link className="font-semibold text-teal-800 hover:underline" to="/doctor/appointments">View schedule</Link>
            </div>
            <AppointmentTable appointments={data.appointments || []} />
          </section>
          <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
            Waiting-patient, lab-review, and follow-up counts are unavailable because the system does not track those workflows.
          </p>
        </>
      )}

      {!loading && (page === "appointments" || page === "schedule") && data && (
        <section className={cardClass}>
          {page === "appointments" && (
            <div className="mb-4 grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-semibold text-slate-700">Search patient, clinic, or service
                <input className={inputClass} value={searchText} onChange={(event) => setSearchText(event.target.value)} />
              </label>
              <label className="text-sm font-semibold text-slate-700">Status
                <select className={inputClass} value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                  <option value="">All statuses</option>
                  {["pending", "confirmed", "completed", "cancelled", "rejected", "no_show"].map((status) => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}
                </select>
              </label>
            </div>
          )}
          {page === "schedule" && (
            <div className="mb-5">
              <h3 className="flex items-center gap-2 text-lg font-bold text-slate-950"><CalendarClock size={20} />Published working hours</h3>
              {data.working_hours?.length
                ? <ul className="mt-3 flex flex-wrap gap-2">{data.working_hours.map((hours) => <li key={hours.day_of_week} className="rounded-lg bg-teal-50 px-3 py-2 text-sm text-teal-950">{["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][hours.day_of_week]} · {hours.start_time}–{hours.end_time}</li>)}</ul>
                : <p className="mt-2 text-sm text-slate-600">No published working hours.</p>}
              {!!data.time_off?.length && <p className="mt-3 text-sm text-amber-800">{data.time_off.length} time-off period(s) overlap the selected date range.</p>}
              <p className="mt-2 text-xs text-slate-500">Schedule is read-only. Changes are managed by clinic administration.</p>
            </div>
          )}
          <AppointmentTable appointments={page === "appointments" ? appointments : data.appointments || []} />
        </section>
      )}

      {!loading && page === "patients" && data && (
        <section className={cardClass}>
          <form className="mb-4 flex flex-wrap items-end gap-3" onSubmit={(event) => { event.preventDefault(); setPageNumber(1); setRefresh((value) => value + 1); }}>
            <label className="min-w-[220px] flex-1 text-sm font-semibold text-slate-700">Find a patient with an existing care relationship
              <input className={inputClass} value={searchText} onChange={(event) => setSearchText(event.target.value)} />
            </label>
            <button type="submit" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-teal-700 px-4 font-semibold text-white"><Search size={16} />Search</button>
          </form>
          {!data.patients?.length ? <EmptyState title="No patients found" description="Only patients with an appointment assigned to you are included." /> : (
            <>
              <ul className="divide-y divide-slate-100">
                {data.patients.map((patient) => <li key={patient.id} className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-1">
                  <div className="flex items-center gap-3"><span className="rounded-full bg-slate-100 p-2 text-slate-600"><Users size={18} /></span><div><p className="font-semibold text-slate-900">{patient.full_name}</p><p className="text-sm text-slate-600">{patient.email} · {patient.appointment_count} appointment(s)</p></div></div>
                  <p className="text-sm text-slate-600">Last appointment: {patient.last_appointment_at ? formatDateTime(patient.last_appointment_at) : "—"}</p>
                </li>)}
              </ul>
              <div className="mt-4 flex items-center justify-between text-sm">
                <span>Page {data.pagination.page} of {Math.max(data.pagination.pages, 1)}</span>
                <div className="flex gap-2">
                  <button type="button" className="rounded-lg border px-3 py-2 disabled:opacity-50" disabled={pageNumber <= 1} onClick={() => setPageNumber((value) => value - 1)}>Previous</button>
                  <button type="button" className="rounded-lg border px-3 py-2 disabled:opacity-50" disabled={pageNumber >= data.pagination.pages} onClick={() => setPageNumber((value) => value + 1)}>Next</button>
                </div>
              </div>
            </>
          )}
        </section>
      )}

      {!loading && page === "services" && data && (
        <section className={cardClass}>
          {!data.services?.length ? <EmptyState title="No assigned services" description="Your profile has no active service assignments." /> : (
            <ul className="divide-y divide-slate-100">{data.services.map((service) => <li key={service.service_id} className="py-4 first:pt-1">
              <h3 className="font-semibold text-slate-900">{service.name}</h3>
              <p className="mt-1 text-sm text-slate-600">{service.clinic_name} · {service.duration_minutes} minutes</p>
              <p className="mt-1 text-sm text-slate-600">Fee {Number(service.fee).toFixed(2)} (currency not configured)</p>
              {service.description && <p className="mt-1 text-sm text-slate-500">{service.description}</p>}
            </li>)}</ul>
          )}
        </section>
      )}

      {!loading && page === "notifications" && data && (
        <section className={cardClass}>
          <div className="mb-4 flex justify-end">
            <button type="button" className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700" onClick={markAllRead}><CheckCheck size={16} />Mark all read</button>
          </div>
          {!data.notifications?.length ? <EmptyState title="No notifications" description="There are no notifications in your account inbox." /> : (
            <ul className="divide-y divide-slate-100">{data.notifications.map((notification) => <li key={notification.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
              <div><p className="font-semibold text-slate-900">{notification.type === "appointment" ? "Appointment notification" : "Account notification"}</p><p className="mt-1 text-sm text-slate-500">{formatDateTime(notification.created_at)} · {notification.is_read ? "Read" : "Unread"}</p></div>
              {!notification.is_read && <button type="button" className="rounded-lg border px-3 py-2 text-sm font-semibold" onClick={() => markRead(notification.id)}>Mark read</button>}
            </li>)}</ul>
          )}
        </section>
      )}
    </div>
  );
}
