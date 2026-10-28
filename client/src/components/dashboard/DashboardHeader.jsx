import { Menu } from "lucide-react";
import Breadcrumbs from "./Breadcrumbs";
import NotificationBell from "./NotificationBell";
import UserProfileMenu from "./UserProfileMenu";

export default function DashboardHeader({
  title,
  breadcrumbs,
  user,
  clinicContext,
  clinicContextError = "",
  onLogout,
  onMobileMenuOpen,
}) {
  return (
    <header className="sticky top-0 z-30 flex min-h-[76px] items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onMobileMenuOpen}
          aria-label="Open navigation menu"
          className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 lg:hidden"
        >
          <Menu size={21} aria-hidden="true" />
        </button>
        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold text-slate-950 sm:text-xl">{title}</h1>
          <Breadcrumbs items={breadcrumbs} />
          {clinicContext && (
            <p className="truncate text-xs text-slate-500 md:hidden">
              Clinic: {clinicContext}
            </p>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        {clinicContext && (
          <div
            className="hidden max-w-48 truncate rounded-lg bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600 md:block"
            title={`${clinicContextError ? "Clinic context unavailable" : "Authorized clinic context"}: ${clinicContextError || clinicContext}`}
          >
            {clinicContextError ? "Clinic context unavailable" : clinicContext}
          </div>
        )}
        <NotificationBell
          to={user?.role === "patient" ? "/patient/notifications" : user?.role === "system_admin" ? "/admin/notifications" : undefined}
        />
        <UserProfileMenu user={user} onLogout={onLogout} />
      </div>
    </header>
  );
}
