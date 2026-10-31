export default function ErrorState({ title = "Something went wrong", message, onRetry, action, className = "" }) {
  return (
    <section
      role="alert"
      className={`ui-alert ui-alert-danger text-sm ${className}`}
    >
      <h2 className="font-semibold">{title}</h2>
      {message && <p className="mt-1 leading-5">{message}</p>}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 min-h-10 rounded-lg border border-rose-300 px-3 py-2 font-semibold hover:bg-rose-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-700"
        >
          Try again
        </button>
      )}
      {action && <div className="mt-3">{action}</div>}
    </section>
  );
}
