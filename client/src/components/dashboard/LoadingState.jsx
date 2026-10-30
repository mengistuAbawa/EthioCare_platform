export default function LoadingState({ label = "Loading...", className = "" }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex min-h-12 items-center gap-3 text-sm text-text-secondary ${className}`}
    >
      <span
        aria-hidden="true"
        className="size-4 animate-spin rounded-full border-2 border-border border-t-brand-teal motion-reduce:animate-none"
      />
      <span>{label}</span>
    </div>
  );
}
