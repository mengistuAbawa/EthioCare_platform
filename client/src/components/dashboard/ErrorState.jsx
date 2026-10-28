export default function ErrorState({ title = "Something went wrong", message, onRetry, className = "" }) {
  return (
    <section
      role="alert"
      className={`rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 ${className}`}
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
    </section>
  );
}
