import { NavLink, useLocation } from "react-router-dom";

export default function SidebarItem({ item, collapsed = false, onNavigate, onLogout }) {
  const Icon = item.icon;
  const location = useLocation();
  const itemHash = item.to?.includes("#") ? item.to.slice(item.to.indexOf("#")) : "";
  const className = (selected) =>
    `group flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors motion-reduce:transition-none ${
      selected
        ? "bg-teal-50 text-teal-800 ring-1 ring-inset ring-teal-100"
        : "text-text-secondary hover:bg-page hover:text-text-primary"
    } ${
      collapsed ? "justify-center px-2" : ""
    }`;
  const content = (
    <>
      <Icon aria-hidden="true" size={19} className="shrink-0" />
      <span className={collapsed ? "sr-only" : "truncate"}>{item.label}</span>
    </>
  );

  if (item.action === "logout") {
    return (
      <button
        type="button"
        onClick={() => {
          onNavigate?.();
          onLogout?.();
        }}
        title={collapsed ? item.label : undefined}
        className={`${className(false)} w-full text-left`}
      >
        {content}
      </button>
    );
  }

  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        className(isActive && (itemHash ? location.hash === itemHash : !location.hash))
      }
    >
      {content}
    </NavLink>
  );
}
