import { DoorIcon, KeyIcon, HingeIcon, LockMark } from './icons.jsx';

// Faint decorative hardware icons scattered behind the auth card — purely
// visual texture, aria-hidden so screen readers skip them.
function BackgroundIcons() {
  const spots = [
    { Icon: DoorIcon, className: 'top-[8%] left-[6%] h-24 w-24 -rotate-6' },
    { Icon: KeyIcon, className: 'bottom-[10%] left-[10%] h-20 w-20 rotate-12' },
    { Icon: HingeIcon, className: 'top-[14%] right-[8%] h-20 w-20 rotate-6' },
    { Icon: LockMark, className: 'bottom-[8%] right-[10%] h-24 w-24 -rotate-3' },
  ];
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {spots.map(({ Icon, className }, i) => (
        <Icon key={i} className={`absolute text-brand-500/[0.07] ${className}`} strokeWidth={1} />
      ))}
    </div>
  );
}

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-[radial-gradient(circle_at_top,_#eaf2fc,_#f9f9f7_55%)] px-4 py-10 overflow-hidden">
      <BackgroundIcons />

      <div className="relative w-full max-w-md">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <img
            src="/logo.png"
            alt="ARK Simplify"
            className="h-12 w-12 rounded-xl border border-hairline object-contain bg-white shadow-[0_8px_20px_-6px_rgba(11,11,11,0.15)]"
          />
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
