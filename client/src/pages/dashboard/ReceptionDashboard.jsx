import { Building2, CalendarCheck2, UsersRound } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import api from "../../services/api";
import { Card, PageHeader } from "../../components/ui/Primitives";

export default function ReceptionDashboard() {
  const { user } = useAuth();
  const [clinics, setClinics] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/clinics/my/clinics")
      .then((response) => setClinics(response.data?.data?.clinics || []))
      .catch((loadError) => setError(loadError.response?.data?.message || "Unable to load your clinics."));
  }, []);

  return (
    <div className="space-y-6">
      <section className="dashboard-hero-panel dashboard-hero-cyan">
        <div>
          <span className="dashboard-kicker"><CalendarCheck2 size={15} /> Reception workspace</span>
          <h2>Welcome, {user?.full_name || "Receptionist"}</h2>
          <p>Coordinate patient flow and access the clinics linked to your reception account.</p>
        </div>
        <div className="dashboard-hero-orbit dashboard-hero-orbit-cyan" aria-hidden="true">
          <span><UsersRound size={28} /></span>
        </div>
      </section>

      <section aria-label="Reception overview" className="grid gap-4 sm:grid-cols-2">
        <Card className="dashboard-action-card dashboard-action-teal">
          <span className="dashboard-action-icon"><Building2 size={22} /></span>
          <div><p className="dashboard-card-label">Authorized clinics</p><h3>{clinics.length}</h3></div>
        </Card>
        <Card className="dashboard-action-card dashboard-action-blue">
          <span className="dashboard-action-icon"><CalendarCheck2 size={22} /></span>
          <div><p className="dashboard-card-label">Front desk role</p><h3>Receptionist</h3></div>
        </Card>
      </section>

      <section id="clinic-list" className="scroll-mt-24 ui-card">
          <PageHeader as="h2" title="Doctors at your clinics" description="Select a clinic to view its doctor roster and supported management actions." />
          {error ? <p className="mt-3 text-sm text-rose-700" role="alert">{error}</p> : null}
          <div className="mt-4 space-y-3">
            {clinics.map((clinic) => (
              <div key={clinic.id} className="dashboard-list-row">
                <div>
                  <span className="dashboard-list-icon"><Building2 size={18} /></span>
                  <span><strong>{clinic.name}</strong><small>{clinic.city || "Clinic location not provided"}</small></span>
                </div>
                <Link to={`/clinic/${clinic.id}/doctors`} className="ui-button ui-button-secondary">
                  View doctors
                </Link>
              </div>
            ))}
            {!error && clinics.length === 0 ? <p className="text-sm text-slate-600">No clinic memberships are available.</p> : null}
          </div>
        </section>
    </div>
  );
}
