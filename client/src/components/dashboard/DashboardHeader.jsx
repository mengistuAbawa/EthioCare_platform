import { Menu } from "lucide-react";
import Breadcrumbs from "./Breadcrumbs";
import NotificationBell from "./NotificationBell";
import UserProfileMenu from "./UserProfileMenu";
import { IconButton } from "../ui/Primitives";

const notificationPathByRole = {
  patient: "/patient/notifications",
  doctor: "/doctor/notifications",
  receptionist: "/receptionist/notifications",
  clinic_admin: "/clinic/admin/notifications",
  system_admin: "/admin/notifications",
};

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
    <header className="sticky top-0 z-30 flex min-h-[72px] items-center justify-between gap-3 border-b border-border bg-surface/95 px-4 backdrop-blur sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <IconButton
          onClick={onMobileMenuOpen}
          label="Open navigation menu"
          className="lg:hidden"
        >
          <Menu size={21} aria-hidden="true" />
        </IconButton>
        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold tracking-tight text-text-primary sm:text-xl">{title}</h1>
          <Breadcrumbs items={breadcrumbs} />
          {clinicContext && (
            <p className="truncate text-xs text-text-secondary md:hidden">
              Clinic: {clinicContext}
            </p>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        {clinicContext && (
          <div
            className="hidden max-w-48 truncate rounded-lg bg-page px-3 py-2 text-xs font-medium text-text-secondary md:block"
            title={`${clinicContextError ? "Clinic context unavailable" : "Authorized clinic context"}: ${clinicContextError || clinicContext}`}
          >
            {clinicContextError ? "Clinic context unavailable" : clinicContext}
          </div>
        )}
        <NotificationBell to={notificationPathByRole[user?.role]} />
        <UserProfileMenu user={user} onLogout={onLogout} />
      </div>
    </header>
  );
}
