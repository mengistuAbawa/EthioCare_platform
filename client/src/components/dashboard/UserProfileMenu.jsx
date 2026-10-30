import { ChevronDown, LogOut, UserRound } from "lucide-react";
import { Link } from "react-router-dom";

export default function UserProfileMenu({ user, onLogout }) {
  const displayName = user?.full_name || "Account";
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
  const avatarUrl = user?.avatar_url || user?.profile_image_url || user?.profile_image;

  return (
    <details className="group relative">
      <summary
        aria-label={`Account menu for ${displayName}`}
        className="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-page [&::-webkit-details-marker]:hidden"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt=""
            className="size-9 shrink-0 rounded-full bg-page object-cover"
          />
        ) : (
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-teal-100 text-sm font-bold text-teal-800">
            {initials || <UserRound size={17} aria-hidden="true" />}
          </span>
        )}
        <span className="hidden max-w-36 text-left sm:block">
          <span className="block truncate text-sm font-semibold text-text-primary">{displayName}</span>
          <span className="block truncate text-xs capitalize text-text-secondary">
            {user?.role?.replaceAll("_", " ")}
          </span>
        </span>
        <ChevronDown size={16} aria-hidden="true" className="hidden text-text-secondary sm:block" />
      </summary>
      <div className="absolute right-0 z-40 mt-2 w-64 rounded-panel border border-border bg-surface p-2 shadow-[var(--shadow-popover)]">
        <div className="border-b border-border px-3 py-2">
          <p className="truncate text-sm font-semibold text-text-primary">{displayName}</p>
          {user?.email && <p className="truncate text-xs text-text-secondary">{user.email}</p>}
          <p className="mt-1 text-xs capitalize text-text-secondary">{user?.role?.replaceAll("_", " ")}</p>
        </div>
        <Link
          to="/account/profile"
          onClick={(event) => {
            event.currentTarget.closest("details")?.removeAttribute("open");
          }}
          className="mt-1 flex min-h-11 items-center rounded-xl px-3 py-2 text-sm font-medium text-text-primary hover:bg-page"
        >
          View profile
        </Link>
        <button
          type="button"
          onClick={onLogout}
          className="mt-1 flex min-h-11 w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-text-primary hover:bg-rose-50 hover:text-rose-700"
        >
          <LogOut size={17} aria-hidden="true" />
          Sign out
        </button>
      </div>
    </details>
  );
}
