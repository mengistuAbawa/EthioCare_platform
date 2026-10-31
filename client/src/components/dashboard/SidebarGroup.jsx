import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { useLocation } from "react-router-dom";
import SidebarItem from "./SidebarItem";

export default function SidebarGroup({ group, collapsed, onNavigate, onLogout, idPrefix }) {
  const [expanded, setExpanded] = useState(true);
  const { pathname, hash } = useLocation();
  const groupId = `${idPrefix}-sidebar-group-${group.label.toLowerCase().replaceAll(" ", "-")}`;
  const groupIsActive = group.items.some((item) => {
    if (!item.to) return false;
    const [itemPath, itemHash] = item.to.split("#");
    const pathIsActive = pathname === itemPath || pathname.startsWith(`${itemPath}/`);
    return pathIsActive && (!itemHash || hash === `#${itemHash}`);
  });

  return (
    <section className="mb-5">
      {collapsed ? (
        <h2 className="sr-only">{group.label}</h2>
      ) : (
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={groupId}
          onClick={() => setExpanded((current) => !current)}
          className={`mb-2 flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.12em] hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 ${
            groupIsActive ? "text-teal-800" : "text-text-secondary"
          }`}
        >
          {group.label}
          <ChevronDown
            size={15}
            aria-hidden="true"
            className={`transition-transform motion-reduce:transition-none ${expanded ? "" : "-rotate-90"}`}
          />
        </button>
      )}
      <div id={groupId} hidden={!collapsed && !expanded} className="space-y-1">
        {group.items.map((item) => (
          <SidebarItem
            key={item.label}
            item={item}
            collapsed={collapsed}
            onNavigate={onNavigate}
            onLogout={onLogout}
          />
        ))}
      </div>
    </section>
  );
}
