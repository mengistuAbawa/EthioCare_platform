import { Bell, BellOff } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getUnreadNotificationCount } from "../../services/notificationService";

export default function NotificationBell({ to }) {
  const [unreadCount, setUnreadCount] = useState(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    getUnreadNotificationCount()
      .then((response) => {
        if (active) {
          setUnreadCount(response.data?.data?.unread_count ?? 0);
          setError("");
        }
      })
      .catch((loadError) => {
        if (active) {
          setError(loadError.response?.data?.message || "Unable to load notifications.");
        }
      });

    return () => {
      active = false;
    };
  }, [attempt]);

  useEffect(() => {
    const refreshCount = () => setAttempt((current) => current + 1);
    window.addEventListener("ethiocare:notifications-updated", refreshCount);
    return () => window.removeEventListener("ethiocare:notifications-updated", refreshCount);
  }, []);

  if (error) {
    return (
      <button
        type="button"
        onClick={() => {
          setError("");
          setUnreadCount(null);
          setAttempt((current) => current + 1);
        }}
        aria-label={`Notification count unavailable. ${error} Retry loading.`}
        title={`${error} Activate to retry.`}
        className="flex size-10 items-center justify-center rounded-xl text-rose-700 hover:bg-rose-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-700"
      >
        <BellOff size={19} aria-hidden="true" />
      </button>
    );
  }

  if (unreadCount === null) {
    return (
      <div role="status" aria-label="Loading notification count" className="relative flex size-10 items-center justify-center rounded-xl text-slate-500">
        <Bell size={19} aria-hidden="true" />
        <span aria-hidden="true" className="absolute right-2 top-2 size-2 animate-pulse rounded-full bg-teal-600 motion-reduce:animate-none" />
        <span className="sr-only">Loading notification count.</span>
      </div>
    );
  }

  const badge = (
    <>
      <Bell size={19} aria-hidden="true" />
      {unreadCount > 0 && (
        <span
          aria-hidden="true"
          className="absolute right-0.5 top-0.5 min-w-4 rounded-full bg-rose-600 px-1 text-center text-[10px] font-bold leading-4 text-white"
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
      <span className="sr-only">
        {unreadCount} unread notification{unreadCount === 1 ? "" : "s"}.
      </span>
    </>
  );
  const className = "relative flex size-10 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700";

  return to ? (
    <Link
      to={to}
      aria-label={`Open notifications. ${unreadCount} unread.`}
      title={`${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`}
      className={className}
    >
      {badge}
    </Link>
  ) : (
    <div role="status" aria-label={`${unreadCount} unread notifications`} className={className}>
      {badge}
    </div>
  );
}
