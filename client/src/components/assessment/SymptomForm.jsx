const emergencyQuestions = [
  ["trouble_breathing", "Are you having severe difficulty breathing?"],
  ["severe_chest_pain", "Are you experiencing severe or sudden chest pain?"],
  ["stroke_signs", "Have you had sudden weakness, facial drooping, or difficulty speaking?"],
  ["severe_bleeding", "Do you have severe bleeding that will not stop?"],
  ["loss_of_consciousness", "Have you fainted or become difficult to wake?"],
  ["severe_allergic_reaction", "Are you experiencing a severe allergic reaction, such as swelling of the tongue or throat?"],
];

const fieldClass = "mt-1 w-full rounded-xl border border-slate-300 px-3 py-2";

export default function SymptomForm({ value, onChange, disabled = false, step = 1 }) {
  const update = (field) => (event) => {
    onChange((current) => ({ ...current, [field]: event.target.value }));
  };
  const updateSafetyAnswer = (key, checked) => {
    onChange((current) => ({
      ...current,
      safety_answers: { ...current.safety_answers, [key]: checked ? "yes" : "no" },
    }));
  };
  if (step === 2) {
    return (
      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-900">Medical history and context</h2>
        <label className="block text-sm font-medium text-slate-700">
          Relevant medical conditions and history
          <textarea
            rows={3}
            maxLength={5000}
            disabled={disabled}
            value={value.medical_history}
            onChange={update("medical_history")}
            className={fieldClass}
          />
        </label>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-medium text-slate-700">
            Current medications
            <textarea
              rows={3}
              maxLength={3000}
              disabled={disabled}
              value={value.medications}
              onChange={update("medications")}
              className={fieldClass}
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Known allergies
            <textarea
              rows={3}
              maxLength={2000}
              disabled={disabled}
              value={value.allergies}
              onChange={update("allergies")}
              className={fieldClass}
            />
          </label>
        </div>
        <label className="block text-sm font-medium text-slate-700">
          Previous treatment for this concern
          <textarea
            rows={2}
            maxLength={3000}
            disabled={disabled}
            value={value.previous_treatment}
            onChange={update("previous_treatment")}
            className={fieldClass}
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Additional notes
          <textarea
            rows={3}
            maxLength={5000}
            disabled={disabled}
            value={value.additional_notes}
            onChange={update("additional_notes")}
            className={fieldClass}
          />
        </label>
      </section>
    );
  }

  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="text-lg font-semibold text-slate-900">Symptoms and safety screening</h2>
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
          className={fieldClass}
          placeholder="Describe what you would like the doctor to review"
        />
      </label>
      <label className="block text-sm font-medium text-slate-700">
        Other symptoms (one per line)
        <textarea
          rows={3}
          disabled={disabled}
          value={value.symptoms}
          onChange={update("symptoms")}
          className={fieldClass}
          placeholder={"For example: headache\nfeeling tired"}
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-slate-700">
          When did this start?
          <input maxLength={200} disabled={disabled} value={value.symptom_onset} onChange={update("symptom_onset")} className={fieldClass} placeholder="For example: yesterday morning" />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          How long has it lasted?
          <input maxLength={200} disabled={disabled} value={value.symptom_duration} onChange={update("symptom_duration")} className={fieldClass} placeholder="For example: about 2 hours each time" />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          How often does it occur?
          <input maxLength={200} disabled={disabled} value={value.symptom_frequency} onChange={update("symptom_frequency")} className={fieldClass} placeholder="For example: several times a day" />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Severity (0–10)
          <select value={value.severity} disabled={disabled} onChange={update("severity")} className={fieldClass}>
            <option value="">Not provided</option>
            {Array.from({ length: 11 }, (_, severity) => (
              <option key={severity} value={severity}>{severity}{severity === 0 ? " — none" : severity === 10 ? " — worst imaginable" : ""}</option>
            ))}
          </select>
        </label>
      </div>
      <label className="block text-sm font-medium text-slate-700">
        Symptoms are currently
        <select value={value.symptom_trend} disabled={disabled} onChange={update("symptom_trend")} className={fieldClass}>
          <option value="">Not sure / not provided</option>
          <option value="improving">Improving</option>
          <option value="stable">About the same</option>
          <option value="worsening">Worsening</option>
        </select>
      </label>

      <fieldset className="space-y-3 rounded-xl border border-slate-200 p-4">
        <legend className="px-1 text-sm font-semibold text-slate-900">Urgent warning signs</legend>
        <p className="text-sm text-slate-600">
          These questions do not diagnose a condition. If any apply, seek emergency medical help now; do not wait to finish this form.
        </p>
        {emergencyQuestions.map(([key, prompt]) => (
          <label key={key} className="flex items-start gap-3 text-sm text-slate-800">
            <input
              type="checkbox"
              checked={value.safety_answers?.[key] === "yes"}
              disabled={disabled}
              onChange={(event) => updateSafetyAnswer(key, event.target.checked)}
              className="mt-1 h-4 w-4 accent-rose-700"
            />
            <span>{prompt}</span>
          </label>
        ))}
      </fieldset>
    </section>
  );
}
