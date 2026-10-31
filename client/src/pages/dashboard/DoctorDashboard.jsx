import { CalendarClock, ClipboardCheck, Stethoscope, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { Card, PageHeader } from "../../components/ui/Primitives";

export default function DoctorDashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <section className="dashboard-hero-panel">
        <div>
          <span className="dashboard-kicker"><Stethoscope size={15} /> Doctor workspace</span>
          <h2>Good day, {user?.full_name || "Doctor"}</h2>
          <p>Your clinical workspace for assessments, appointments, and professional profile management.</p>
        </div>
        <div className="dashboard-hero-orbit" aria-hidden="true">
          <span><UserRound size={28} /></span>
        </div>
      </section>

      <section aria-label="Doctor actions" className="grid gap-4 md:grid-cols-3">
        <Card as="article" className="dashboard-action-card dashboard-action-violet">
          <span className="dashboard-action-icon"><ClipboardCheck size={22} /></span>
          <div>
            <p className="dashboard-card-label">Patient work</p>
            <h3>Assessment inbox</h3>
            <Link to="/doctor/assessments" className="dashboard-card-link">Review assessments <span>→</span></Link>
          </div>
        </Card>
        <Card as="article" className="dashboard-action-card dashboard-action-teal">
          <span className="dashboard-action-icon"><UserRound size={22} /></span>
          <div>
            <p className="dashboard-card-label">Public information</p>
            <h3>Professional profile</h3>
            <Link to="/doctor/profile" className="dashboard-card-link">Manage profile <span>→</span></Link>
          </div>
        </Card>
        <Card as="article" className="dashboard-action-card dashboard-action-blue">
          <span className="dashboard-action-icon"><CalendarClock size={22} /></span>
          <div>
            <p className="dashboard-card-label">Schedule</p>
            <h3>Appointments</h3>
            <Link to="/doctor/appointments" className="dashboard-card-link">View schedule <span>→</span></Link>
          </div>
        </Card>
      </section>

      <PageHeader
        as="h3"
        title="Your daily workflow"
        description="Start with the assessment inbox, then keep your professional availability and clinic information current."
      />
    </div>
  );
}
