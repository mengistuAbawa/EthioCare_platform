export default function EmptyState({ title, description, action, className = "" }) {
  return (
    <section className={`rounded-2xl border border-dashed border-slate-300 bg-white p-6 ${className}`}>
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      {description && <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </section>
  );
}
