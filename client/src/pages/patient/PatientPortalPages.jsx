import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import EmptyState from "../../components/dashboard/EmptyState";
import ErrorState from "../../components/dashboard/ErrorState";
import LoadingState from "../../components/dashboard/LoadingState";
import { Button, Card, FormField, PageHeader, StatusBadge } from "../../components/ui/Primitives";
import {
  getMyNotifications,
  markAllMyNotificationsRead,
  markMyNotificationRead,
} from "../../services/notificationService";

const formatDate = (value) => new Date(value).toLocaleString();

const featureDetails = {
  services: {
    title: "Browse Services",
    description: "Services are currently shown with eligible clinics and doctors.",
    limitation: "There is no standalone public service search API. Explore clinic details to see their active services and pricing information when available.",
    link: { to: "/patient/clinics", label: "Find clinics" },
  },
  "book-appointment": {
    title: "Book Appointment",
    description: "Appointment booking is not available yet.",
    limitation: "The database has appointment and schedule tables, but the backend has no patient-facing availability or booking API. Booking must validate live slots and clinic policy on the server before confirming a request.",
    link: { to: "/patient/doctors", label: "Find doctors" },
  },
  "medical-files": {
    title: "My Medical Images & Reports",
    description: "Files uploaded to your health assessments are stored privately.",
    limitation: "Files are listed within each assessment, not in a separate patient file library. Open an assessment to access attached files through the existing ownership-checked download flow.",
    link: { to: "/patient/assessments", label: "Open assessment history" },
  },
  "lab-results": {
    title: "My Lab Results",
    description: "Lab values currently belong to individual health assessments.",
    limitation: "There is no separate lab-results record or verification workflow. View values in an assessment; patient-submitted values are not represented as clinician-verified.",
    link: { to: "/patient/assessments", label: "Open assessment history" },
  },
  "medical-records": {
    title: "My Medical Records",
    description: "Released medical records are not available in the current patient portal.",
    limitation: "The application has no medical-record release model or API. Assessment data is shown only in the existing patient assessment workflow.",
    link: { to: "/patient/assessments", label: "Open assessment history" },
  },
  consultations: {
    title: "Online Consultation",
    description: "Online consultations are not configured in this application.",
    limitation: "No video-consultation provider, session authorization API, or consultation workflow is present.",
    link: { to: "/patient/appointments", label: "View appointments" },
  },
  "health-profile": {
    title: "Health Profile",
    description: "A longitudinal patient health profile is not available yet.",
    limitation: "The schema captures medical history, medications, allergies, and lab values within individual assessments. It has no separate patient health-profile record or update workflow.",
    link: { to: "/patient/assessment/new", label: "Share information in an assessment" },
  },
  settings: {
    title: "Settings & Privacy",
    description: "Patient-specific preference and consent settings are not configured.",
    limitation: "There is no patient preference, privacy-consent, or retention-settings API. This page does not change consent or delete account data.",
    link: { to: "/account/profile", label: "Manage account profile" },
  },
};

export function PatientPortalFeaturePage({ feature }) {
  const detail = featureDetails[feature];
  if (!detail) {
    return <EmptyState title="Patient portal page not found" description="Choose an option from the patient portal navigation." />;
  }

  return (
    <Card as="section">
      <PageHeader title={detail.title} description={detail.description} className="mb-5" />
      <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
        {detail.limitation}
      </div>
      <Link to={detail.link.to} className="ui-button ui-button-primary mt-5">
        {detail.link.label}
      </Link>
    </Card>
  );
}

export function PatientNotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [readFilter, setReadFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  const load = useCallback(async () => {
    try {
      const params = { page, limit: 20 };
      if (readFilter) params.read = readFilter;
      const response = await getMyNotifications(params);
      setNotifications(response.data?.data?.notifications || []);
      setPagination(response.data?.data?.pagination || null);
      setError("");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load your notifications.");
    } finally {
      setLoading(false);
    }
  }, [page, readFilter]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [attempt, load]);

  const refresh = () => {
    setLoading(true);
    setError("");
    setAttempt((current) => current + 1);
  };

  const updateNotifications = async (update) => {
    setUpdating(true);
    setError("");
    try {
      await update();
      refresh();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to update notifications.");
    } finally {
      setUpdating(false);
    }
  };

  const unreadExists = notifications.some((notification) => !notification.is_read);

  return (
    <Card as="section">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <PageHeader title="Notifications" description="Notifications addressed to your signed-in account." />
        <Button
          loading={updating}
          disabled={!unreadExists}
          onClick={() => updateNotifications(markAllMyNotificationsRead)}
        >
          Mark all notifications read
        </Button>
      </div>

      <FormField id="notification-read-filter" label="Filter by read status" className="mb-4 max-w-xs">
        <select
          className="ui-control w-full text-sm"
          value={readFilter}
          onChange={(event) => {
            setLoading(true);
            setError("");
            setPage(1);
            setReadFilter(event.target.value);
          }}
        >
          <option value="">All notifications</option>
          <option value="false">Unread</option>
          <option value="true">Read</option>
        </select>
      </FormField>

      {error && <ErrorState message={error} onRetry={refresh} className="mb-4" />}
      {loading ? <LoadingState label="Loading notifications..." /> : notifications.length === 0 ? (
        <EmptyState title="No notifications" description="No notifications match this filter." />
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <article
              key={notification.id}
              className={`rounded-xl border p-4 ${notification.is_read ? "border-slate-200" : "border-teal-200 bg-teal-50/50"}`}
            >
              <div className="flex flex-col justify-between gap-3 sm:flex-row">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-slate-950">{notification.title}</h3>
                    <StatusBadge status={notification.is_read ? "completed" : "pending"} label={notification.is_read ? "Read" : "Unread"} />
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{notification.message}</p>
                  <p className="mt-2 text-xs capitalize text-slate-500">
                    {String(notification.type || "update").replaceAll("_", " ")} · {formatDate(notification.created_at)}
                  </p>
                </div>
                {!notification.is_read && (
                  <Button
                    loading={updating}
                    onClick={() => updateNotifications(() => markMyNotificationRead(notification.id))}
                  >
                    Mark as read
                  </Button>
                )}
              </div>
            </article>
          ))}
          {pagination?.pages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
              <p className="text-sm text-slate-600">Page {pagination.page} of {pagination.pages}</p>
              <div className="flex gap-2">
                <Button type="button" variant="secondary" disabled={page <= 1} onClick={() => { setLoading(true); setPage((current) => current - 1); }}>
                  Previous
                </Button>
                <Button type="button" variant="secondary" disabled={page >= pagination.pages} onClick={() => { setLoading(true); setPage((current) => current + 1); }}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
