export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[radial-gradient(circle_at_top,_#eaf2fc,_#f9f9f7_55%)] px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="h-9 w-9 rounded-lg bg-brand-500 flex items-center justify-center text-white font-bold text-sm">
            AH
          </div>
          <span className="text-ink font-semibold text-lg tracking-tight">ARK Hardware Portal</span>
        </div>

        <div className="bg-surface border border-hairline rounded-2xl shadow-[0_20px_50px_-20px_rgba(11,11,11,0.15)] p-8">
          <h1 className="text-xl font-semibold text-ink mb-1">{title}</h1>
          {subtitle && <p className="text-sm text-ink-secondary mb-6">{subtitle}</p>}
          {children}
        </div>

        {footer && <div className="mt-6 text-center text-sm text-ink-secondary">{footer}</div>}
      </div>
    </div>
  );
}
