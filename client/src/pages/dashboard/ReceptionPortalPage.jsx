import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowRight, CalendarCheck2, CalendarPlus, ClipboardList, Clock3,
  Phone, Search, Stethoscope, UserRound, Users,
} from "lucide-react";
import EmptyState from "../../components/dashboard/EmptyState";
import ErrorState from "../../components/dashboard/ErrorState";
import LoadingState from "../../components/dashboard/LoadingState";
import api from "../../services/api";
import {
  createReceptionAppointment,
  getReceptionAppointments,
  getReceptionCatalog,
  getReceptionDashboard,
  getReceptionPatients,
  updateReceptionAppointmentStatus,
} from "../../services/receptionistService";

const panelClass = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6";
const buttonClass = "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:cursor-not-allowed disabled:opacity-50";
const secondaryButtonClass = "inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50";
const inputClass = "mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20";

const getTodayInEthiopia = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Addis_Ababa" }).format(new Date());
const formatDateTime = (value) => new Intl.DateTimeFormat("en-ET", {
  timeZone: "Africa/Addis_Ababa", dateStyle: "medium", timeStyle: "short",
}).format(new Date(value));

function AppointmentList({ appointments, onStatusChange, busyId, scheduleOnly = false }) {
  if (!appointments.length) {
    return <EmptyState title="No appointments for this date" description="There are no clinic appointments scheduled for the selected day." />;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
          <tr><th className="px-3 py-3">Time</th><th className="px-3 py-3">Patient</th><th className="px-3 py-3">Doctor / service</th><th className="px-3 py-3">Status</th>{!scheduleOnly && <th className="px-3 py-3">Actions</th>}</tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {appointments.map((appointment) => {
            const actions = appointment.status === "pending"
              ? [["confirmed", "Confirm"], ["rejected", "Reject"], ["cancelled", "Cancel"]]
              : appointment.status === "confirmed"
                ? [["no_show", "Mark no-show"], ["cancelled", "Cancel"]]
                : [];
            return (
              <tr key={appointment.id} className="align-top">
                <td className="whitespace-nowrap px-3 py-4 font-medium text-slate-900">{formatDateTime(appointment.starts_at)}</td>
                <td className="px-3 py-4"><p className="font-semibold text-slate-900">{appointment.patient_name}</p>{appointment.patient_phone && <p className="mt-1 text-slate-500">{appointment.patient_phone}</p>}</td>
                <td className="px-3 py-4"><p className="font-medium text-slate-900">{appointment.doctor_name}</p><p className="mt-1 text-slate-500">{appointment.service_name}</p></td>
                <td className="px-3 py-4"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold capitalize text-slate-700">{appointment.status.replace("_", " ")}</span></td>
                {!scheduleOnly && <td className="px-3 py-4"><div className="flex flex-wrap gap-2">{actions.map(([status, label]) => <button key={status} type="button" className={secondaryButtonClass} disabled={busyId === appointment.id} onClick={() => onStatusChange(appointment.id, status)}>{label}</button>)}</div></td>}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Unavailable({ title, description }) {
  return (
    <section className={panelClass}>
      <h2 className="text-xl font-bold text-slate-950">{title}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{description}</p>
      <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
        This feature is unavailable until the application has the required secure workflow and server-side data model. No sample or simulated records are shown.
      </p>
    </section>
  );
}

export default function ReceptionPortalPage({ page = "dashboard" }) {
  const { clinicId: routeClinicId } = useParams();
  const [clinics, setClinics] = useState([]);
  const [selectedClinicId, setSelectedClinicId] = useState(routeClinicId || "");
  const [clinicsLoading, setClinicsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let active = true;
    api.get("/clinics/my/clinics")
      .then((response) => {
        if (!active) return;
        const available = response.data?.data?.clinics || [];
        setClinics(available);
        setSelectedClinicId((current) => {
          if (current && available.some((clinic) => String(clinic.id) === String(current))) return String(current);
          return available.length === 1 ? String(available[0].id) : "";
        });
      })
      .catch((error) => {
        if (active) setLoadError(error.response?.data?.message || "Unable to load your clinic memberships.");
      })
      .finally(() => { if (active) setClinicsLoading(false); });
    return () => { active = false; };
  }, []);

  const clinic = useMemo(() => clinics.find((item) => String(item.id) === String(selectedClinicId)), [clinics, selectedClinicId]);
  const retryClinics = useCallback(() => window.location.reload(), []);

  if (clinicsLoading) return <LoadingState label="Loading your clinic access..." />;
  if (loadError) return <ErrorState message={loadError} onRetry={retryClinics} />;
  if (!clinics.length) return <EmptyState title="No clinic access" description="A clinic administrator must grant you active receptionist membership before you can use this portal." />;

  return (
    <div className="space-y-5">
      {clinics.length > 1 && (
        <label className={`${panelClass} block`}>
          <span className="text-sm font-semibold text-slate-900">Clinic</span>
          <select className={inputClass} value={selectedClinicId} onChange={(event) => setSelectedClinicId(event.target.value)} aria-label="Select clinic">
            <option value="">Select a clinic</option>
            {clinics.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.city}</option>)}
          </select>
        </label>
      )}
      {!clinic ? <EmptyState title="Select a clinic" description="Choose one of your authorized clinics to view its reception workspace." /> : (
        <ReceptionClinicWorkspace key={`${clinic.id}-${page}`} page={page} clinic={clinic} />
      )}
    </div>
  );
}

function ReceptionClinicWorkspace({ clinic, page }) {
  const [date, setDate] = useState(getTodayInEthiopia());
  const [data, setData] = useState(null);
  const [patients, setPatients] = useState([]);
  const [catalog, setCatalog] = useState({ doctors: [], services: [] });
  const [search, setSearch] = useState("");
  const [patientSearch, setPatientSearch] = useState("");
  const [appointmentSearch, setAppointmentSearch] = useState("");
  const [appointmentStatus, setAppointmentStatus] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [formMessage, setFormMessage] = useState("");
  const [formError, setFormError] = useState("");
  const [attempt, setAttempt] = useState(0);

  const loadData = useCallback(async () => {
    setLoading(true);
    setFormError("");
    try {
      if (page === "patients" || page === "booking") {
        const response = await getReceptionPatients(clinic.id, search);
        setPatients(response.data?.data?.patients || []);
      }
      if (["doctors-services", "doctor-availability", "services", "booking"].includes(page)) {
        const response = await getReceptionCatalog(clinic.id);
        setCatalog(response.data?.data || { doctors: [], services: [] });
      }
      if (page === "dashboard") {
        const response = await getReceptionDashboard(clinic.id, date);
        setData(response.data?.data || null);
      }
      if (page === "appointments" || page === "queue") {
        const response = await getReceptionAppointments(clinic.id, date);
        setData(response.data?.data || null);
      }
    } catch (error) {
      setFormError(error.response?.data?.message || "Unable to load the clinic reception data.");
    } finally {
      setLoading(false);
    }
  }, [clinic.id, date, page, search]);

  const filteredAppointments = useMemo(() => (data?.appointments || []).filter((appointment) => {
    const query = appointmentSearch.trim().toLowerCase();
    const matchesText = !query || [
      appointment.patient_name,
      appointment.doctor_name,
      appointment.service_name,
    ].some((value) => String(value || "").toLowerCase().includes(query));
    return matchesText && (!appointmentStatus || appointment.status === appointmentStatus);
  }), [appointmentSearch, appointmentStatus, data]);

  useEffect(() => {
    void Promise.resolve().then(loadData);
  }, [loadData, attempt]);

  const changeStatus = async (appointmentId, status) => {
    setBusyId(appointmentId);
    setFormError("");
    try {
      await updateReceptionAppointmentStatus(clinic.id, appointmentId, status);
      await loadData();
    } catch (error) {
      setFormError(error.response?.data?.message || "Unable to update appointment status.");
    } finally {
      setBusyId(null);
    }
  };

  const submitBooking = async (event) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    setFormError("");
    setFormMessage("");
    const form = new FormData(formElement);
    const inputDate = String(form.get("starts_at") || "");
    if (!inputDate) {
      setFormError("Select an appointment date and time.");
      return;
    }
    try {
      const startsAt = new Date(`${inputDate}:00+03:00`);
      const response = await createReceptionAppointment(clinic.id, {
        patient_id: form.get("patient_id"),
        doctor_id: form.get("doctor_id"),
        service_id: form.get("service_id"),
        starts_at: startsAt.toISOString(),
        reason: form.get("reason"),
      });
      setFormMessage(response.data?.message || "Appointment request created.");
      formElement.reset();
      setSelectedDoctor("");
    } catch (error) {
      setFormError(error.response?.data?.message || "Unable to create the appointment request.");
    }
  };

  if (page === "patient-registration") {
    return <Unavailable title="Patient registration" description="The current patient registration flow cannot securely create patient credentials and does not provide a receptionist-specific enrollment or verification process. Do not share or create passwords at the front desk. Ask patients to register through the existing account flow." />;
  }
  if (page === "check-in-out") {
    return <Unavailable title="Check-in & Check-out" description="Appointments do not have attendance timestamps or check-in/check-out states in the current database. Appointment status is kept separate from reception attendance; the portal will not mark a clinical visit complete as a substitute." />;
  }
  if (page === "notifications") {
    return <Unavailable title="Clinic notifications" description="The available notifications are user-specific. There is no receptionist-scoped clinic inbox, so personal notifications are not substituted." />;
  }
  if (page === "settings") {
    return <Unavailable title="Reception settings" description="Receptionist preferences are not stored in the current data model or API. Your account profile remains available from My Profile." />;
  }

  return (
    <div className="space-y-5">
      <section className={panelClass}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-teal-800">{clinic.name} · {clinic.city}</p>
            <h2 className="mt-1 text-xl font-bold text-slate-950">{{
              dashboard: "Reception overview", appointments: "Appointment management",
              booking: "Book an appointment", patients: "Patient directory",
              "doctors-services": "Doctors and services", "doctor-availability": "Doctor availability",
              services: "Clinic services", "check-in-out": "Check-in & Check-out",
              queue: "Today’s schedule",
            }[page] || "Reception workspace"}</h2>
            <p className="mt-1 text-sm text-slate-600">{page === "queue" ? "Scheduled appointments in time order; this is not a check-in queue." : "Clinic data is limited to your active receptionist membership."}</p>
          </div>
          {(page === "dashboard" || page === "appointments" || page === "queue") && (
            <label className="min-w-[180px] text-sm font-semibold text-slate-700">Date
              <input className={inputClass} type="date" value={date} onChange={(event) => setDate(event.target.value)} />
            </label>
          )}
        </div>
      </section>

      {formError && <p className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800" role="alert">{formError}</p>}
      {formMessage && <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800" role="status">{formMessage}</p>}
      {loading ? <LoadingState label="Loading clinic data..." /> : null}
      {!loading && page === "dashboard" && data && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[["Appointments", data.stats.total, CalendarCheck2], ["Pending", data.stats.pending, Clock3], ["Confirmed", data.stats.confirmed, ClipboardList], ["Completed", data.stats.completed, Users]].map(([label, value, Icon]) => (
              <article key={label} className={`${panelClass} flex items-center gap-4`}>
                <span className="rounded-xl bg-teal-50 p-3 text-teal-800"><Icon size={20} aria-hidden="true" /></span>
                <div><p className="text-sm text-slate-500">{label}</p><p className="text-2xl font-bold text-slate-950">{value}</p></div>
              </article>
            ))}
          </div>
          <section className={panelClass}>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-bold text-slate-950">Appointments · {date}</h3>
              <Link className={buttonClass} to="/receptionist/appointments">Manage appointments <ArrowRight size={16} aria-hidden="true" /></Link>
            </div>
            <AppointmentList appointments={data.appointments || []} scheduleOnly />
          </section>
        </>
      )}
      {!loading && (page === "appointments" || page === "queue") && data && (
        <section className={panelClass}>
          {page === "queue" && <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">Check-in and queue position are not tracked by the current system. This page shows the scheduled agenda only.</p>}
          {page === "appointments" && (
            <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_12rem]">
              <label className="text-sm font-medium text-slate-700">Search patient, doctor, or service
                <input className={inputClass} value={appointmentSearch} onChange={(event) => setAppointmentSearch(event.target.value)} />
              </label>
              <label className="text-sm font-medium text-slate-700">Status
                <select className={inputClass} value={appointmentStatus} onChange={(event) => setAppointmentStatus(event.target.value)}>
                  <option value="">All statuses</option>
                  {["pending", "confirmed", "completed", "cancelled", "rejected", "no_show"].map((status) => <option key={status} value={status}>{status.replace("_", " ")}</option>)}
                </select>
              </label>
            </div>
          )}
          <AppointmentList appointments={page === "appointments" ? filteredAppointments : data.appointments || []} scheduleOnly={page === "queue"} busyId={busyId} onStatusChange={changeStatus} />
        </section>
      )}
      {!loading && page === "patients" && (
        <section className={panelClass}>
          <form className="mb-4 flex flex-wrap gap-2" onSubmit={(event) => { event.preventDefault(); setSearch(patientSearch.trim()); }}>
            <label className="sr-only" htmlFor="patient-search">Search patients previously seen at this clinic</label>
            <input id="patient-search" className={`${inputClass} mt-0 min-w-[220px] flex-1`} value={patientSearch} onChange={(event) => setPatientSearch(event.target.value)} placeholder="Search name, email or phone" />
            <button type="submit" className={buttonClass}><Search size={16} aria-hidden="true" />Search</button>
          </form>
          {!patients.length ? <EmptyState title="No matching patients" description="Only patients with an appointment at this clinic appear in this directory." /> : (
            <ul className="divide-y divide-slate-100">
              {patients.map((patient) => <li key={patient.id} className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-1">
                <div className="flex items-center gap-3"><span className="rounded-full bg-slate-100 p-2 text-slate-600"><UserRound size={18} aria-hidden="true" /></span><div><p className="font-semibold text-slate-900">{patient.full_name}</p><p className="text-sm text-slate-500">{patient.email} · {patient.appointment_count} appointment(s)</p></div></div>
                {patient.phone && <a className="inline-flex items-center gap-2 text-sm font-medium text-teal-800" href={`tel:${patient.phone}`}><Phone size={15} aria-hidden="true" />{patient.phone}</a>}
              </li>)}
            </ul>
          )}
        </section>
      )}
      {!loading && ["doctors-services", "doctor-availability", "services"].includes(page) && (
        <div className="grid gap-5 lg:grid-cols-2">
          {(page === "doctors-services" || page === "doctor-availability") && <section className={panelClass}><h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-950"><Stethoscope size={20} aria-hidden="true" />Doctors</h3>
            {!catalog.doctors.length ? <EmptyState title="No active doctors" description="No active doctors are available in this clinic." /> : <ul className="divide-y divide-slate-100">{catalog.doctors.map((doctor) => <li key={doctor.id} className="py-3 first:pt-0"><p className="font-semibold text-slate-900">{doctor.name}</p><p className="text-sm text-slate-600">{doctor.specialty} · {doctor.is_available ? "Available for booking" : "Unavailable for booking"}</p><p className="mt-1 text-sm text-slate-600">Weekly hours: {doctor.working_hours.length ? doctor.working_hours.map((hours) => `${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][hours.day_of_week]} ${hours.start_time}–${hours.end_time}`).join(", ") : "No published working hours"}</p>{doctor.upcoming_time_off.length > 0 && <p className="mt-1 text-xs text-amber-800">{doctor.upcoming_time_off.length} upcoming unavailable period(s) in the next 60 days</p>}<p className="mt-1 text-xs text-slate-500">Services: {doctor.services.map((service) => service.name).join(", ") || "None assigned"}</p></li>)}</ul>}
          </section>}
          {(page === "doctors-services" || page === "services") && <section className={panelClass}><h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-950"><ClipboardList size={20} aria-hidden="true" />Services</h3>
          {!catalog.services.length ? <EmptyState title="No active services" description="No active services are available in this clinic." /> : <ul className="divide-y divide-slate-100">{catalog.services.map((service) => <li key={service.id} className="py-3 first:pt-0"><p className="font-semibold text-slate-900">{service.name}</p><p className="text-sm text-slate-600">{service.duration_minutes} minutes · Fee: {Number(service.fee).toFixed(2)} (currency not configured)</p>{service.description && <p className="mt-1 text-sm text-slate-500">{service.description}</p>}</li>)}</ul>}
          </section>}
        </div>
      )}
      {!loading && page === "booking" && (
        <section className={panelClass}>
          <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-950">Appointments are created as pending requests. Clinic hours are evaluated using Africa/Addis_Ababa because the current clinic schema does not store a timezone. Registration is not available here; select a patient account already seen at this clinic.</p>
          {!patients.length || !catalog.doctors.length || !catalog.services.length ? <EmptyState title="Booking needs existing records" description="This clinic needs at least one patient with a prior appointment, one active doctor, and one active service before a receptionist can create an appointment request." /> : (
            <form className="grid gap-4 md:grid-cols-2" onSubmit={submitBooking}>
              <label className="text-sm font-semibold text-slate-700">Existing patient<select required name="patient_id" className={inputClass}><option value="">Select patient</option>{patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.full_name} · {patient.phone || patient.email}</option>)}</select></label>
              <label className="text-sm font-semibold text-slate-700">Doctor<select required name="doctor_id" className={inputClass} value={selectedDoctor} onChange={(event) => setSelectedDoctor(event.target.value)}><option value="">Select doctor</option>{catalog.doctors.filter((doctor) => doctor.is_available).map((doctor) => <option key={doctor.id} value={doctor.id}>{doctor.name} · {doctor.specialty}</option>)}</select></label>
              <label className="text-sm font-semibold text-slate-700">Service<select required name="service_id" className={inputClass} disabled={!selectedDoctor}><option value="">Select service</option>{(catalog.doctors.find((doctor) => String(doctor.id) === selectedDoctor)?.services || []).map((service) => <option key={service.id} value={service.id}>{service.name} ({service.duration_minutes || catalog.services.find((item) => item.id === service.id)?.duration_minutes} min)</option>)}</select></label>
              <label className="text-sm font-semibold text-slate-700">Start time (EAT)<input required name="starts_at" type="datetime-local" className={inputClass} /></label>
              <label className="text-sm font-semibold text-slate-700 md:col-span-2">Reason (optional)<textarea name="reason" maxLength="1000" rows="3" className={inputClass} /></label>
              <div className="md:col-span-2"><button type="submit" className={buttonClass}><CalendarPlus size={16} aria-hidden="true" />Create appointment request</button></div>
            </form>
          )}
        </section>
      )}
      {!loading && page === "dashboard" && !data && <ErrorState message="Reception dashboard data is unavailable." onRetry={() => setAttempt((value) => value + 1)} />}
    </div>
  );
}
