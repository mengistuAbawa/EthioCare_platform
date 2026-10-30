import { ArrowRight, Building2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import EmptyState from "../../components/dashboard/EmptyState";
import ErrorState from "../../components/dashboard/ErrorState";
import LoadingState from "../../components/dashboard/LoadingState";
import { Card, PageHeader } from "../../components/ui/Primitives";
import api from "../../services/api";

const clinicTools = {
  staff: {
    title: "Staff Management",
    description: "Manage clinic staff membership and access.",
    dependency: "The current backend does not provide clinic staff-management endpoints. Staff access remains controlled by existing server authorization.",
  },
  doctors: {
    title: "Doctor Management",
    description: "Open a clinic workspace to manage its doctor profiles.",
    clinicPicker: true,
  },
  services: {
    title: "Services Management",
    description: "Review clinic services in the doctor and services workspace.",
    clinicPicker: true,
    dependency: "Clinic service creation, editing, and deactivation are not available through the current backend API.",
  },
  "doctor-services": {
    title: "Doctor-Service Assignments",
    description: "Choose a clinic to manage its doctors and service assignments.",
    clinicPicker: true,
  },
  schedules: {
    title: "Doctor Schedules",
    description: "Manage clinician availability and scheduling.",
    dependency: "The current application does not provide a clinic-admin schedule management page or API.",
  },
  appointments: {
    title: "Appointment Management",
    description: "Review and manage appointments for your clinics.",
    dependency: "Clinic-scoped appointment management endpoints are not currently available.",
  },
  patients: {
    title: "Patient Directory",
    description: "Access patient records within your authorized clinics.",
    dependency: "A clinic-scoped patient directory is not currently available. Patient information is not exposed here.",
  },
  queue: {
    title: "Reception & Queue Overview",
    description: "Monitor reception activity and clinic queues.",
    dependency: "The current application does not provide a reception queue or clinic queue overview API.",
  },
  analytics: {
    title: "Clinic Analytics",
    description: "Review clinic-level operational and appointment trends.",
    dependency: "Clinic-scoped analytics are not currently available; no sample or synthetic statistics are shown.",
  },
  notifications: {
    title: "Notifications",
    description: "Review notifications relevant to your clinic workspace.",
    dependency: "The existing notification API provides an unread count but does not provide a clinic-admin notification inbox.",
  },
  settings: {
    title: "Clinic Settings",
    description: "Configure authorized preferences for your clinic.",
    dependency: "The current application does not expose a clinic settings model or settings API.",
  },
};

export default function ClinicAdminToolsPage() {
  const { feature } = useParams();
  const tool = clinicTools[feature];
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  const loadClinics = useCallback(async () => {
    try {
      const response = await api.get("/clinics/my/clinics");
      setClinics(response.data?.data?.clinics || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load your authorized clinics.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!tool?.clinicPicker) return;
    void Promise.resolve().then(loadClinics);
  }, [loadClinics, attempt, tool?.clinicPicker]);

  if (!tool) {
    return <EmptyState title="Clinic workspace page not found" description="Choose a page from the clinic administration sidebar." />;
  }

  return (
    <div>
      <PageHeader title={tool.title} description={tool.description} className="mb-5" />

      {tool.clinicPicker ? (
        <Card as="section">
          {tool.dependency && (
            <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              {tool.dependency}
            </p>
          )}
          {error ? (
            <ErrorState
              message={error}
              onRetry={() => {
                setLoading(true);
                setError("");
                setAttempt((current) => current + 1);
              }}
            />
          ) : loading ? (
            <LoadingState label="Loading your clinics..." />
          ) : clinics.length === 0 ? (
            <EmptyState
              title="No clinics available"
              description="Register a clinic or ask an administrator to grant you clinic access."
            />
          ) : (
            <ul className="grid gap-3 md:grid-cols-2">
              {clinics.map((clinic) => (
                <li key={clinic.id} className="rounded-xl border border-border p-4">
                  <div className="flex items-start gap-3">
                    <Building2 size={20} aria-hidden="true" className="mt-0.5 shrink-0 text-teal-700" />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-slate-950">{clinic.name}</h3>
                      <p className="mt-1 text-sm text-slate-600">
                        {clinic.city}{clinic.region ? `, ${clinic.region}` : ""}
                      </p>
                      <Link
                        to={`/clinic/${clinic.id}/doctors`}
                        className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-lg bg-teal-700 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
                      >
                        Open clinic workspace <ArrowRight size={16} aria-hidden="true" />
                      </Link>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      ) : (
        <Card as="section">
          <EmptyState title="Feature not available yet" description={tool.dependency} />
        </Card>
      )}
    </div>
  );
}
