import { X } from "lucide-react";
import { useEffect, useRef } from "react";

export default function MobileSidebar({ open, onClose, children }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const dialog = dialogRef.current;
    const previousFocus = document.activeElement;
    const firstFocusable = dialog?.querySelector("[data-dialog-close]");
    firstFocusable?.focus();

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab" || !dialog) return;

      const focusable = [...dialog.querySelectorAll("button:not(:disabled), a[href]")];
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, [open, onClose]);

  return (
    <div
      className={`fixed inset-0 z-50 lg:hidden ${open ? "" : "pointer-events-none"}`}
      aria-hidden={!open}
      inert={!open}
    >
      <button
        type="button"
        tabIndex={open ? 0 : -1}
        aria-label="Close navigation menu"
        onClick={onClose}
        className={`absolute inset-0 cursor-default bg-brand-navy/40 transition-opacity motion-reduce:transition-none ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />
      <aside
        ref={dialogRef}
        role="dialog"
        aria-modal={open ? "true" : undefined}
        aria-label="Dashboard navigation"
        className={`absolute inset-y-0 left-0 flex w-[min(20rem,85vw)] flex-col border-r border-border bg-surface shadow-[var(--shadow-popover)] transition-transform motion-reduce:transition-none ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          type="button"
          onClick={onClose}
          data-dialog-close
          aria-label="Close navigation menu"
          className="absolute right-3 top-4 z-10 flex min-h-11 min-w-11 items-center justify-center rounded-lg text-text-secondary hover:bg-page"
        >
          <X size={20} />
        </button>
        {children}
      </aside>
    </div>
  );
}
