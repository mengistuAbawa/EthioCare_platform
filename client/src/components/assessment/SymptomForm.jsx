export default function SymptomForm({ value, onChange, disabled = false }) {
  const update = (field) => (event) => {
    onChange((current) => ({ ...current, [field]: event.target.value }));
  };

  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="text-lg font-semibold text-slate-900">Your health information</h2>
      <label className="block text-sm font-medium text-slate-700">
        Main concern
        <textarea
          required
          minLength={2}
          maxLength={2000}
          rows={3}
          disabled={disabled}
          value={value.chief_complaint}
          onChange={update("chief_complaint")}
          className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
          placeholder="Describe what you would like the doctor to review"
        />
      </label>
      <label className="block text-sm font-medium text-slate-700">
        Symptoms (one per line)
        <textarea
          rows={3}
          disabled={disabled}
          value={value.symptoms}
          onChange={update("symptoms")}
          className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
          placeholder="For example: headache&#10;feeling tired"
        />
      </label>
      <label className="block text-sm font-medium text-slate-700">
        Relevant medical history
        <textarea
          rows={2}
          maxLength={5000}
          disabled={disabled}
          value={value.medical_history}
          onChange={update("medical_history")}
          className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
        />
      </label>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm font-medium text-slate-700">
          Current medications
          <textarea
            rows={2}
            maxLength={3000}
            disabled={disabled}
            value={value.medications}
            onChange={update("medications")}
            className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Allergies
          <textarea
            rows={2}
            maxLength={2000}
            disabled={disabled}
            value={value.allergies}
            onChange={update("allergies")}
            className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
          />
        </label>
      </div>
    </section>
  );
}
