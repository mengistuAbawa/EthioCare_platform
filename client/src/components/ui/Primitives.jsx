import { cloneElement, isValidElement, useEffect, useId, useRef } from "react";
import { Search } from "lucide-react";

const buttonVariants = {
  primary: "ui-button-primary",
  secondary: "ui-button-secondary",
  danger: "ui-button-danger",
  quiet: "ui-button-quiet",
};

export function Button({
  variant = "primary",
  type = "button",
  loading = false,
  disabled = false,
  className = "",
  children,
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`ui-button ${buttonVariants[variant] || buttonVariants.primary} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function IconButton({ label, className = "", children, ...props }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`ui-icon-button ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Card({ as: Element = "section", className = "", children, ...props }) {
  return (
    <Element className={`ui-card p-5 sm:p-6 ${className}`} {...props}>
      {children}
    </Element>
  );
}

export function PageHeader({ as: Element = "h2", title, description, actions, className = "" }) {
  return (
    <div className={`ui-page-header ${className}`}>
      <div className="min-w-0">
        <Element className="ui-page-title">{title}</Element>
        {description && <p className="ui-page-description">{description}</p>}
      </div>
      {actions && <div className="ui-page-actions">{actions}</div>}
    </div>
  );
}

export function FormField({
  id,
  label,
  required = false,
  hint,
  error,
  children,
  className = "",
}) {
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ");
  const control = isValidElement(children)
    ? cloneElement(children, {
        id,
        required,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": describedBy || undefined,
      })
    : children;

  return (
    <div className={`ui-form-field ${className}`}>
      <label className="ui-label" htmlFor={id}>
        {label}
        {required && <span className="ui-required" aria-hidden="true"> *</span>}
      </label>
      {control}
      {hint && <p id={`${id}-hint`} className="ui-field-hint">{hint}</p>}
      {error && <p id={`${id}-error`} className="ui-field-error" role="alert">{error}</p>}
    </div>
  );
}

export function SearchInput({ label = "Search", className = "", ...props }) {
  return (
    <label className={`ui-search-input ${className}`}>
      <span className="sr-only">{label}</span>
      <Search size={17} aria-hidden="true" />
      <input type="search" aria-label={label} {...props} />
    </label>
  );
}

export function Badge({ tone = "neutral", className = "", children, ...props }) {
  return (
    <span className={`ui-badge ui-badge-${tone} ${className}`} {...props}>
      {children}
    </span>
  );
}

const statusTones = {
  active: "success",
  approved: "success",
  available: "success",
  completed: "success",
  confirmed: "success",
  reviewed: "success",
  verified: "success",
  pending: "warning",
  submitted: "warning",
  in_review: "warning",
  no_show: "warning",
  draft: "neutral",
  not_configured: "info",
  cancelled: "danger",
  rejected: "danger",
  suspended: "danger",
  failed: "danger",
};

export function StatusBadge({ status, label, ...props }) {
  const key = String(status || "unknown").toLowerCase();
  const displayLabel = label || key.replaceAll("_", " ");
  return (
    <Badge tone={statusTones[key] || "neutral"} {...props}>
      {displayLabel}
    </Badge>
  );
}

export function ConfirmationDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "danger",
  loading = false,
  onConfirm,
  onCancel,
}) {
  const dialogRef = useRef(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) return undefined;

    const dialog = dialogRef.current;
    const previousFocus = document.activeElement;
    const cancelButton = dialog?.querySelector("[data-dialog-cancel]");
    cancelButton?.focus();

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !loading) {
        onCancel();
        return;
      }
      if (event.key !== "Tab" || !dialog) return;

      const focusable = [...dialog.querySelectorAll("button:not(:disabled)")];
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
  }, [open, loading, onCancel]);

  if (!open) return null;

  return (
    <div className="ui-dialog-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !loading) onCancel();
    }}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="ui-dialog"
      >
        <h2 id={titleId} className="ui-dialog-title">{title}</h2>
        <p id={descriptionId} className="ui-dialog-description">{description}</p>
        <div className="ui-dialog-actions">
          <Button data-dialog-cancel variant="secondary" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={tone === "danger" ? "danger" : "primary"} loading={loading} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
