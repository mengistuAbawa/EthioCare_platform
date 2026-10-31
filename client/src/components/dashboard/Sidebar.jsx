import { HeartPulse, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { getDashboardNavigation } from "../../config/dashboardNavigation";
import EmptyState from "./EmptyState";
import SidebarGroup from "./SidebarGroup";
import { useLanguage } from "../../i18n/LanguageContext";

export default function Sidebar({
  role,
  collapsed = false,
  mobile = false,
  onNavigate,
  onLogout,
  onToggleCollapse,
}) {
  const groups = getDashboardNavigation(role);
  const { language } = useLanguage();
  const patientTranslations = {
    Overview: "አጠቃላይ እይታ",
    "Discover Healthcare": "የጤና አገልግሎት ያግኙ",
    "Find Clinics": "ክሊኒኮችን ፈልግ",
    "Find Doctors": "ዶክተሮችን ፈልግ",
    "Browse Services": "አገልግሎቶችን ያስሱ",
    Appointments: "ቀጠሮዎች",
    "Book Appointment": "ቀጠሮ ያስይዙ",
    "My Appointments": "ቀጠሮዎቼ",
    "Appointment History": "የቀጠሮ ታሪክ",
    "My Health": "ጤናዬ",
    "Health Assessment": "የጤና ግምገማ",
    "My Medical Images & Reports": "የሕክምና ምስሎቼ እና ሪፖርቶቼ",
    "My Lab Results": "የላቦራቶሪ ውጤቶቼ",
    "My Medical Records": "የሕክምና መዝገቦቼ",
    "Online Consultation": "የመስመር ላይ ምክክር",
    Communication: "ግንኙነት",
    Notifications: "ማሳወቂያዎች",
    Account: "መለያ",
    "Health Profile": "የጤና መገለጫ",
    "My Profile": "የእኔ መገለጫ",
    "Settings & Privacy": "ቅንብሮች እና ግላዊነት",
  };
  const translatedGroups = role === "patient" && language === "am"
    ? groups.map((group) => ({
        ...group,
        label: patientTranslations[group.label] || group.label,
        items: group.items.map((item) => ({ ...item, label: patientTranslations[item.label] || item.label })),
      }))
    : groups;

  return (
    <div className="flex h-full min-h-0 flex-col bg-surface">
      <div className={`flex h-[72px] shrink-0 items-center border-b border-border ${collapsed ? "justify-center px-3" : "justify-between px-5"}`}>
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-teal text-white shadow-sm">
            <HeartPulse size={21} aria-hidden="true" />
          </span>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-text-primary">
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
              <p className="truncate text-xs text-text-secondary">
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
                <p className="truncate text-[10px] leading-3 text-text-secondary">Clinical Care &amp; Patient Follow-up</p>
              )}
              {role === "receptionist" && (
                <p className="truncate text-[10px] leading-3 text-text-secondary">Front Desk &amp; Patient Flow</p>
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
            className="min-h-11 min-w-11 rounded-lg p-2 text-text-secondary hover:bg-page hover:text-text-primary"
          >
            {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        )}
      </div>

      <nav aria-label="Dashboard navigation" className="min-h-0 flex-1 overflow-y-auto px-3 py-5">
        {groups.length ? (
          translatedGroups.map((group) => (
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
        <div className="border-t border-border px-5 py-4">
          <p className="text-xs leading-5 text-text-secondary">
            Secure access to care and clinic services.
          </p>
        </div>
      )}
    </div>
  );
}
