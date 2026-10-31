export default function AiSummaryPanel({ status = "disabled", summary = null }) {
  return (
    <section className="rounded-xl border border-amber-200 bg-amber-50 p-4">
      <h3 className="font-semibold text-amber-950">AI summary</h3>
      <p className="mt-1 text-sm text-amber-900">
        {status === "disabled" || status === "not_configured"
          ? "No validated AI provider is configured. No health information is sent for AI analysis, and this feature does not provide a diagnosis."
          : `AI summary status: ${status}. A clinician should verify all information independently.`}
      </p>
      {summary && <p className="mt-3 whitespace-pre-wrap text-sm text-slate-800">{summary}</p>}
    </section>
  );
}
