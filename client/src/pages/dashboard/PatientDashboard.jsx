import { useCallback, useEffect, useState } from "react";
import { ArrowRight, Bell, CalendarPlus, ClipboardList, Stethoscope } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import EmptyState from "../../components/dashboard/EmptyState";
import ErrorState from "../../components/dashboard/ErrorState";
import LoadingState from "../../components/dashboard/LoadingState";
import { getMyAssessments } from "../../services/assessmentService";
import { getUnreadNotificationCount } from "../../services/notificationService";
import { getMyAppointments } from "../../services/patientAppointmentService";
import { StatusBadge } from "../../components/ui/Primitives";
import { useLanguage } from "../../i18n/LanguageContext";
import { DistributionChart } from "../../components/dashboard/DashboardCharts";

const cardClass = "ui-card p-5";
const formatDate = (value) => new Date(value).toLocaleString();

export default function PatientDashboard() {
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const amharic = language === "am";
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
  const draftCount = assessments.filter((assessment) => assessment.status === "draft").length;
  const awaitingReviewCount = assessments.filter((assessment) => ["submitted", "in_review"].includes(assessment.status)).length;
  const reviewedCount = assessments.filter((assessment) => assessment.status === "reviewed").length;
  const approvedPlanCount = assessments.reduce(
    (total, assessment) => total + Number(assessment.approved_treatment_plan_count || 0),
    0
  );

  return (
    <div className="space-y-6">
      <section className="dashboard-hero-panel dashboard-hero-coral">
        <div>
          <span className="dashboard-kicker"><Stethoscope size={15} /> Patient care</span>
          <h2>{amharic ? "እንኳን ደህና መጡ" : "Welcome"}, {user?.full_name || (amharic ? "ታካሚ" : "Patient")}</h2>
          <p>{amharic ? "ቀጠሮዎችዎ፣ የጤና ግምገማዎችዎ እና የእንክብካቤ መረጃዎ በአንድ ቦታ።" : "Your appointments, health assessments, and care information in one place."}</p>
        </div>
        <Link to="/patient/assessment/new" className="ui-button ui-button-primary w-full sm:w-auto">
          <ClipboardList size={18} aria-hidden="true" /> {t("startAssessment")}
        </Link>
      </section>

      <section aria-label="Patient overview" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Link to="/patient/assessments" className={`${cardClass} transition-colors hover:border-teal-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700`}>
          <ClipboardList className="text-teal-700" size={21} aria-hidden="true" />
          <p className="mt-3 text-sm text-slate-600">{t("healthAssessments")}</p>
          <p className="mt-1 text-3xl font-bold text-slate-950">{assessments.length}</p>
        </Link>
        <Link to="/patient/assessments" className={`${cardClass} transition-colors hover:border-teal-300`}>
          <ClipboardList className="text-teal-700" size={21} aria-hidden="true" />
          <p className="mt-3 text-sm text-slate-600">{t("draftAssessments")}</p>
          <p className="mt-1 text-3xl font-bold text-slate-950">{draftCount}</p>
        </Link>
        <Link to="/patient/assessments" className={`${cardClass} transition-colors hover:border-teal-300`}>
          <ClipboardList className="text-amber-700" size={21} aria-hidden="true" />
          <p className="mt-3 text-sm text-slate-600">{t("awaitingDoctorReview")}</p>
          <p className="mt-1 text-3xl font-bold text-slate-950">{awaitingReviewCount}</p>
        </Link>
        <Link to="/patient/assessments" className={`${cardClass} transition-colors hover:border-teal-300`}>
          <Stethoscope className="text-violet-700" size={21} aria-hidden="true" />
          <p className="mt-3 text-sm text-slate-600">{t("reviewedByDoctor")}</p>
          <p className="mt-1 text-3xl font-bold text-slate-950">{reviewedCount}</p>
        </Link>
        <Link to="/patient/assessments" className={`${cardClass} transition-colors hover:border-teal-300`}>
          <Stethoscope className="text-emerald-700" size={21} aria-hidden="true" />
          <p className="mt-3 text-sm text-slate-600">Available doctor-approved plans</p>
          <p className="mt-1 text-3xl font-bold text-slate-950">{approvedPlanCount}</p>
        </Link>
        <Link to="/patient/notifications" className={`${cardClass} transition-colors hover:border-teal-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700`}>
          <Bell className="text-teal-700" size={21} aria-hidden="true" />
          <p className="mt-3 text-sm text-slate-600">{t("unreadNotifications")}</p>
          <p className="mt-1 text-3xl font-bold text-slate-950">{unreadCount}</p>
        </Link>
        <Link to="/patient/appointments" className={`${cardClass} transition-colors hover:border-teal-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700`}>
          <CalendarPlus className="text-teal-700" size={21} aria-hidden="true" />
          <p className="mt-3 text-sm text-slate-600">{t("upcomingAppointments")}</p>
          <p className="mt-1 text-3xl font-bold text-slate-950">{upcomingCount}</p>
        </Link>
      </section>

      <section className={cardClass}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-950">Assessment progress</h2>
            <p className="mt-1 text-sm text-slate-600">Current health journey distribution.</p>
          </div>
        </div>
        <DistributionChart data={[
          { name: "Draft", value: draftCount },
          { name: "Awaiting review", value: awaitingReviewCount },
          { name: "Reviewed", value: reviewedCount },
        ]} />
      </section>

      <section className={cardClass}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-950">{t("upcomingAppointments")}</h2>
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
                <span className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
                  {formatDate(appointment.starts_at)} <StatusBadge status={appointment.status} />
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={cardClass}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-950">{t("recentAssessments")}</h2>
            <p className="mt-1 text-sm text-slate-600">Only a brief summary is shown here. Open an assessment for its details.</p>
          </div>
          <Link to="/patient/assessments" className="inline-flex items-center gap-1 text-sm font-semibold text-teal-800 hover:underline">
            {t("viewHistory")} <ArrowRight size={16} aria-hidden="true" />
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
                  <span className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
                    <StatusBadge status={assessment.status} /> {formatDate(assessment.created_at)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <Link to="/patient/clinics" className={`${cardClass} flex items-center justify-between gap-3 hover:border-teal-300`}>
          <span><span className="block font-semibold text-slate-950">{t("findClinic")}</span><span className="mt-1 block text-sm text-slate-600">{amharic ? "የተረጋገጡ የጤና አገልግሎት ሰጪዎችን ያስሱ።" : "Explore verified care providers."}</span></span>
          <Stethoscope size={20} className="shrink-0 text-teal-700" aria-hidden="true" />
        </Link>
        <Link to="/patient/doctors" className={`${cardClass} flex items-center justify-between gap-3 hover:border-teal-300`}>
          <span><span className="block font-semibold text-slate-950">{t("findDoctor")}</span><span className="mt-1 block text-sm text-slate-600">{amharic ? "የተረጋገጡ የዶክተር መገለጫዎችን ይፈልጉ።" : "Search approved doctor profiles."}</span></span>
          <Stethoscope size={20} className="shrink-0 text-teal-700" aria-hidden="true" />
        </Link>
      </section>
    </div>
  );
}
