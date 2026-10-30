import { cloneElement, isValidElement } from "react";
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
