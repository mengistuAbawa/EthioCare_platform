import { HeartPulse, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { getDashboardNavigation } from "../../config/dashboardNavigation";
import EmptyState from "./EmptyState";
import SidebarGroup from "./SidebarGroup";

export default function Sidebar({
  role,
  collapsed = false,
  mobile = false,
  onNavigate,
  onLogout,
  onToggleCollapse,
}) {
  const groups = getDashboardNavigation(role);

  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <div className={`flex h-[76px] shrink-0 items-center border-b border-slate-200 ${collapsed ? "justify-center px-3" : "justify-between px-5"}`}>
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-teal-700 text-white">
            <HeartPulse size={21} aria-hidden="true" />
          </span>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-950">
                {role === "receptionist"
                  ? "EthioCare"
                  : role === "system_admin"
                  ? "EthioCare Admin"
                  : role === "clinic_admin"
                    ? "EthioCare Clinic"
                    : role === "patient"
                      ? "EthioCare"
                      : "EthioCare"}
              </p>
              <p className="truncate text-xs text-slate-500">
                {role === "doctor"
                  ? "Doctor Portal"
                  : role === "receptionist"
                  ? "Reception Portal"
                  : role === "system_admin"
                  ? "Platform-wide administration"
                  : role === "clinic_admin"
                    ? "Clinic administration"
                    : role === "patient"
                      ? "Patient Portal"
                    : "Care management"}
              </p>
              {role === "doctor" && (
                <p className="truncate text-[10px] leading-3 text-slate-500">Clinical Care &amp; Patient Follow-up</p>
              )}
              {role === "receptionist" && (
                <p className="truncate text-[10px] leading-3 text-slate-500">Front Desk &amp; Patient Flow</p>
              )}
            </div>
          )}
        </div>
        {!mobile && (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
          >
            {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        )}
      </div>

      <nav aria-label="Dashboard navigation" className="min-h-0 flex-1 overflow-y-auto px-3 py-5">
        {groups.length ? (
          groups.map((group) => (
            <SidebarGroup
              key={group.label}
              group={group}
              collapsed={collapsed && !mobile}
              onNavigate={onNavigate}
              onLogout={onLogout}
              idPrefix={mobile ? "mobile" : "desktop"}
            />
          ))
        ) : (
          <EmptyState
            title="No navigation available"
            description="This account does not have a supported dashboard role."
            className="p-4"
          />
        )}
      </nav>

      {!collapsed && (
        <div className="border-t border-slate-200 px-5 py-4">
          <p className="text-xs leading-5 text-slate-500">
            Secure access to care and clinic services.
          </p>
        </div>
      )}
    </div>
  );
}
