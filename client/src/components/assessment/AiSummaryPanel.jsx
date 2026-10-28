export default function AiSummaryPanel({ status = "disabled" }) {
  return (
    <section className="rounded-xl border border-amber-200 bg-amber-50 p-4">
      <h3 className="font-semibold text-amber-950">AI summary</h3>
      <p className="mt-1 text-sm text-amber-900">
        {status === "disabled"
          ? "AI summaries are disabled. No health information is sent to an AI provider. This feature does not provide a diagnosis."
          : `AI summary status: ${status}. A clinician should verify all information independently.`}
      </p>
    </section>
  );
}
