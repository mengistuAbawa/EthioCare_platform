import { useCallback, useEffect, useState } from "react";
import { ArrowRight, Bell, CalendarPlus, ClipboardList, Stethoscope } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import EmptyState from "../../components/dashboard/EmptyState";
import ErrorState from "../../components/dashboard/ErrorState";
import LoadingState from "../../components/dashboard/LoadingState";
import { getMyAssessments } from "../../services/assessmentService";
import { getUnreadNotificationCount } from "../../services/notificationService";
import { getMyAppointments } from "../../services/patientAppointmentService";

const cardClass = "rounded-2xl border border-slate-200 bg-white p-5";
const formatDate = (value) => new Date(value).toLocaleString();

export default function PatientDashboard() {
  const { user } = useAuth();
  const [assessments, setAssessments] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [upcomingCount, setUpcomingCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  const load = useCallback(async () => {
    try {
      const [assessmentResponse, notificationResponse, appointmentResponse] = await Promise.all([
        getMyAssessments(),
        getUnreadNotificationCount(),
        getMyAppointments({ period: "upcoming", page: 1, limit: 3 }),
      ]);
      setAssessments(assessmentResponse.data?.data?.assessments || []);
      setUnreadCount(notificationResponse.data?.data?.unread_count ?? 0);
      setAppointments(appointmentResponse.data?.data?.appointments || []);
      setUpcomingCount(appointmentResponse.data?.data?.pagination?.total || 0);
      setError("");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load your patient overview.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [attempt, load]);

  if (loading) return <LoadingState label="Loading your health overview..." />;
  if (error) {
    return (
      <ErrorState
        message={error}
        onRetry={() => {
          setLoading(true);
          setError("");
          setAttempt((current) => current + 1);
        }}
      />
    );
  }

  const recentAssessments = assessments.slice(0, 3);

  return (
    <div className="space-y-6">
      <section className={`${cardClass} flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between`}>
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-800">Patient Portal</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-950">Welcome, {user?.full_name || "Patient"}</h2>
          <p className="mt-1 text-sm text-slate-600">Your healthcare information and care tools in one place.</p>
        </div>
        <Link
          to="/patient/assessment/new"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
        >
          <ClipboardList size={18} aria-hidden="true" /> Start assessment
        </Link>
      </section>

      <section aria-label="Patient overview" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Link to="/patient/assessments" className={`${cardClass} transition-colors hover:border-teal-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700`}>
          <ClipboardList className="text-teal-700" size={21} aria-hidden="true" />
          <p className="mt-3 text-sm text-slate-600">Health assessments</p>
          <p className="mt-1 text-3xl font-bold text-slate-950">{assessments.length}</p>
        </Link>
        <Link to="/patient/notifications" className={`${cardClass} transition-colors hover:border-teal-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700`}>
          <Bell className="text-teal-700" size={21} aria-hidden="true" />
          <p className="mt-3 text-sm text-slate-600">Unread notifications</p>
          <p className="mt-1 text-3xl font-bold text-slate-950">{unreadCount}</p>
        </Link>
        <Link to="/patient/appointments" className={`${cardClass} transition-colors hover:border-teal-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700`}>
          <CalendarPlus className="text-teal-700" size={21} aria-hidden="true" />
          <p className="mt-3 text-sm text-slate-600">Upcoming appointments</p>
          <p className="mt-1 text-3xl font-bold text-slate-950">{upcomingCount}</p>
        </Link>
      </section>

      <section className={cardClass}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-950">Upcoming appointments</h2>
            <p className="mt-1 text-sm text-slate-600">Appointments belonging to your account.</p>
          </div>
          <Link to="/patient/appointments" className="inline-flex items-center gap-1 text-sm font-semibold text-teal-800 hover:underline">
            View appointments <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
        {appointments.length === 0 ? (
          <EmptyState title="No upcoming appointments" description="Your upcoming appointment list is currently empty." className="mt-4" />
        ) : (
          <ul className="mt-4 divide-y divide-slate-100">
            {appointments.map((appointment) => (
              <li key={appointment.id} className="flex flex-col justify-between gap-2 py-4 sm:flex-row sm:items-center">
                <span>
                  <span className="block font-semibold text-slate-900">{appointment.service_name}</span>
                  <span className="mt-1 block text-sm text-slate-600">Dr. {appointment.doctor_name} · {appointment.clinic_name}</span>
                </span>
                <span className="text-sm text-slate-500">{formatDate(appointment.starts_at)} · {appointment.status}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={cardClass}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-950">Recent health assessments</h2>
            <p className="mt-1 text-sm text-slate-600">Only a brief summary is shown here. Open an assessment for its details.</p>
          </div>
          <Link to="/patient/assessments" className="inline-flex items-center gap-1 text-sm font-semibold text-teal-800 hover:underline">
            View history <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
        {recentAssessments.length === 0 ? (
          <EmptyState
            title="No assessments yet"
            description="When you submit a health assessment, its status and date will appear here."
            className="mt-4"
          />
        ) : (
          <ul className="mt-4 divide-y divide-slate-100">
            {recentAssessments.map((assessment) => (
              <li key={assessment.id}>
                <Link
                  to={`/patient/assessments/${assessment.id}`}
                  className="flex flex-col justify-between gap-2 py-4 hover:text-teal-800 sm:flex-row sm:items-center"
                >
                  <span>
                    <span className="block font-semibold text-slate-900">{assessment.chief_complaint}</span>
                    <span className="mt-1 block text-sm text-slate-600">
                      Dr. {assessment.doctor_name} · {assessment.doctor_specialty}
                    </span>
                  </span>
                  <span className="text-sm text-slate-500">
                    <span className="mr-2 capitalize">{assessment.status.replaceAll("_", " ")}</span>
                    {formatDate(assessment.created_at)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <Link to="/patient/clinics" className={`${cardClass} flex items-center justify-between gap-3 hover:border-teal-300`}>
          <span><span className="block font-semibold text-slate-950">Find a clinic</span><span className="mt-1 block text-sm text-slate-600">Explore verified care providers.</span></span>
          <Stethoscope size={20} className="shrink-0 text-teal-700" aria-hidden="true" />
        </Link>
        <Link to="/patient/doctors" className={`${cardClass} flex items-center justify-between gap-3 hover:border-teal-300`}>
          <span><span className="block font-semibold text-slate-950">Find a doctor</span><span className="mt-1 block text-sm text-slate-600">Search approved doctor profiles.</span></span>
          <Stethoscope size={20} className="shrink-0 text-teal-700" aria-hidden="true" />
        </Link>
      </section>
    </div>
  );
}
