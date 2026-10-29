const emptyResult = () => ({
  name: "",
  value: "",
  unit: "",
  reference_interval: "",
  collected_at: "",
  lab_name: "",
});

export default function LabResultForm({ results, onChange, disabled = false }) {
  const updateResult = (index, field, value) => {
    onChange((current) =>
      current.map((result, resultIndex) =>
        resultIndex === index ? { ...result, [field]: value } : result
      )
    );
  };

  const addResult = () => {
    if (results.length < 30) onChange((current) => [...current, emptyResult()]);
  };

  const removeResult = (index) => {
    onChange((current) => current.filter((_, resultIndex) => resultIndex !== index));
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Lab results</h2>
          <p className="mt-1 text-sm text-slate-600">
            Optional. Enter the reported values exactly as shown. Patient-entered values remain unverified until reviewed by a clinician.
          </p>
        </div>
        <button
          type="button"
          disabled={disabled || results.length >= 30}
          onClick={addResult}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50"
        >
          Add result
        </button>
      </div>
      <div className="mt-4 space-y-3">
        {results.map((result, index) => (
          <div key={index} className="grid gap-2 rounded-xl border border-slate-100 p-3 sm:grid-cols-2">
            <input
              aria-label="Test name"
              maxLength={200}
              placeholder="Test name"
              required
              disabled={disabled}
              value={result.name}
              onChange={(event) => updateResult(index, "name", event.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2"
            />
            <input
              aria-label="Result value"
              maxLength={500}
              placeholder="Result value"
              required
              disabled={disabled}
              value={result.value}
              onChange={(event) => updateResult(index, "value", event.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2"
            />
            <input
              aria-label="Unit"
              maxLength={80}
              placeholder="Unit"
              disabled={disabled}
              value={result.unit}
              onChange={(event) => updateResult(index, "unit", event.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2"
            />
            <input
              aria-label="Laboratory reference interval as reported"
              maxLength={200}
              placeholder="Reference interval as reported"
              disabled={disabled}
              value={result.reference_interval || ""}
              onChange={(event) => updateResult(index, "reference_interval", event.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2"
            />
            <input
              aria-label="Laboratory name"
              maxLength={200}
              placeholder="Laboratory name (optional)"
              disabled={disabled}
              value={result.lab_name || ""}
              onChange={(event) => updateResult(index, "lab_name", event.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2"
            />
            <input
              aria-label="Collection date"
              type="date"
              disabled={disabled}
              value={result.collected_at || ""}
              onChange={(event) => updateResult(index, "collected_at", event.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2"
            />
            <button
              type="button"
              disabled={disabled}
              onClick={() => removeResult(index)}
              className="justify-self-start rounded-lg px-2 py-2 text-sm font-semibold text-rose-700 disabled:opacity-50"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
