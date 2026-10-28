import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { dashboardHomeByRole } from "../../config/dashboardNavigation";

export default function AccessDenied() {
  const { user } = useAuth();
  const homePath = dashboardHomeByRole[user?.role] || "/login";

  return (
    <section className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-wide text-rose-700">Access denied</p>
      <h2 className="mt-2 text-2xl font-bold text-slate-950">You can’t view this page</h2>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        Your account does not have permission to access this area.
      </p>
      <Link
        to={homePath}
        className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
      >
        Return to your dashboard
      </Link>
    </section>
  );
}
