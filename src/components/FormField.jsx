export default function FormField({ label, id, className = '', ...inputProps }) {
  return (
    <div className="mb-4">
      <label htmlFor={id} className="block text-sm font-medium text-ink-secondary mb-1.5">
        {label}
      </label>
      <input
        id={id}
        className={`w-full rounded-lg border border-hairline bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition ${className}`}
        {...inputProps}
      />
    </div>
  );
}
