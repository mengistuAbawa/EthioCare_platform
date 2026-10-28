export default function LoadingState({ label = "Loading...", className = "" }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-center gap-3 text-sm text-slate-600 ${className}`}
    >
      <span
        aria-hidden="true"
        className="size-4 animate-spin rounded-full border-2 border-slate-300 border-t-teal-700 motion-reduce:animate-none"
      />
      <span>{label}</span>
    </div>
  );
}
