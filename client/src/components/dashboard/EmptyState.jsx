export default function EmptyState({ title, description, action, className = "" }) {
  return (
    <section className={`rounded-card border border-dashed border-border-strong bg-surface p-6 ${className}`}>
      <h2 className="text-base font-semibold text-text-primary">{title}</h2>
      {description && <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </section>
  );
}
