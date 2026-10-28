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
        className="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 [&::-webkit-details-marker]:hidden"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt=""
            className="size-9 shrink-0 rounded-full bg-slate-100 object-cover"
          />
        ) : (
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-teal-100 text-sm font-bold text-teal-800">
            {initials || <UserRound size={17} aria-hidden="true" />}
          </span>
        )}
        <span className="hidden max-w-36 text-left sm:block">
          <span className="block truncate text-sm font-semibold text-slate-900">{displayName}</span>
          <span className="block truncate text-xs capitalize text-slate-500">
            {user?.role?.replaceAll("_", " ")}
          </span>
        </span>
        <ChevronDown size={16} aria-hidden="true" className="hidden text-slate-500 sm:block" />
      </summary>
      <div className="absolute right-0 z-40 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-lg">
        <div className="border-b border-slate-100 px-3 py-2">
          <p className="truncate text-sm font-semibold text-slate-900">{displayName}</p>
          {user?.email && <p className="truncate text-xs text-slate-500">{user.email}</p>}
          <p className="mt-1 text-xs capitalize text-slate-500">{user?.role?.replaceAll("_", " ")}</p>
        </div>
        <Link
          to="/account/profile"
          onClick={(event) => {
            event.currentTarget.closest("details")?.removeAttribute("open");
          }}
          className="mt-1 flex min-h-10 items-center rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
        >
          View profile
        </Link>
        <button
          type="button"
          onClick={onLogout}
          className="mt-1 flex min-h-10 w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-rose-50 hover:text-rose-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600"
        >
          <LogOut size={17} aria-hidden="true" />
          Sign out
        </button>
      </div>
    </details>
  );
}
