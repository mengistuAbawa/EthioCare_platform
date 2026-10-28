const emptyResult = () => ({ name: "", value: "", unit: "", tested_at: "" });

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
          <p className="mt-1 text-sm text-slate-600">Optional. Enter results exactly as shown.</p>
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
          <div key={index} className="grid gap-2 sm:grid-cols-5">
            <input
              aria-label="Test name"
              maxLength={200}
              placeholder="Test name"
              disabled={disabled}
              value={result.name}
              onChange={(event) => updateResult(index, "name", event.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 sm:col-span-2"
            />
            <input
              aria-label="Result value"
              maxLength={500}
              placeholder="Result value"
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
            <button
              type="button"
              disabled={disabled}
              onClick={() => removeResult(index)}
              className="rounded-lg px-2 py-2 text-sm font-semibold text-rose-700 disabled:opacity-50"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
