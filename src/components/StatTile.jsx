export default function StatTile({ label, value, accent = 'brand' }) {
  const accentClasses = {
    brand: 'text-brand-600 bg-brand-50',
    good: 'text-[#006300] bg-good/10',
  };

  return (
    <div className="bg-surface border border-hairline rounded-xl p-4 flex-1 min-w-[160px]">
      <p className="text-xs font-medium text-ink-muted uppercase tracking-wide mb-1">{label}</p>
      <p
        className={`text-2xl font-semibold tabular-nums inline-flex items-center rounded-md px-1.5 -mx-1.5 ${accentClasses[accent] || ''}`}
      >
        {value}
      </p>
    </div>
  );
}
