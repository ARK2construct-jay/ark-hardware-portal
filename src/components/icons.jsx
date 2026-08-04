// A small set of original, hand-drawn line-art icons (no external assets, no
// third-party icon library) used to give the portal a bit of visual identity
// around door hardware — a lock/key mark for the brand, and per-category
// icons for the hardware results table.

function Base({ children, className = 'h-5 w-5', ...props }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {children}
    </svg>
  );
}

// Padlock — used as the brand mark (logo) across the app.
export function LockMark(props) {
  return (
    <Base {...props}>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
      <circle cx="12" cy="15.5" r="1.4" fill="currentColor" stroke="none" />
    </Base>
  );
}

export function DoorIcon(props) {
  return (
    <Base {...props}>
      <rect x="6" y="3" width="12" height="18" rx="1" />
      <circle cx="14.5" cy="12" r="0.9" fill="currentColor" stroke="none" />
    </Base>
  );
}

export function KeyIcon(props) {
  return (
    <Base {...props}>
      <circle cx="8" cy="8" r="4" />
      <path d="M11 11l9 9M17 17l2-2M14.5 19.5l2-2" />
    </Base>
  );
}

export function HingeIcon(props) {
  return (
    <Base {...props}>
      <rect x="3" y="4" width="6" height="6" rx="1.2" />
      <rect x="3" y="14" width="6" height="6" rx="1.2" />
      <line x1="15" y1="2" x2="15" y2="22" />
      <circle cx="15" cy="7" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="17" r="1.1" fill="currentColor" stroke="none" />
    </Base>
  );
}

export function CloserIcon(props) {
  return (
    <Base {...props}>
      <rect x="4" y="4" width="9" height="16" rx="1" />
      <path d="M13 6h7v4" />
      <path d="M13 14l7-4" />
    </Base>
  );
}

export function KickplateIcon(props) {
  return (
    <Base {...props}>
      <rect x="5" y="3" width="14" height="18" rx="1" />
      <rect x="5" y="15" width="14" height="6" rx="1" fill="currentColor" stroke="none" opacity="0.18" />
      <line x1="5" y1="15" x2="19" y2="15" />
    </Base>
  );
}

export function ThresholdIcon(props) {
  return (
    <Base {...props}>
      <rect x="3" y="10" width="18" height="4" rx="1" />
      <line x1="6" y1="14" x2="6" y2="17" />
      <line x1="10" y1="14" x2="10" y2="17" />
      <line x1="14" y1="14" x2="14" y2="17" />
      <line x1="18" y1="14" x2="18" y2="17" />
    </Base>
  );
}

export function SealIcon(props) {
  return (
    <Base {...props}>
      <path d="M4 6c3 2 3-2 6 0s3-2 6 0s3-2 4 0" />
      <path d="M4 12c3 2 3-2 6 0s3-2 6 0s3-2 4 0" />
      <path d="M4 18c3 2 3-2 6 0s3-2 6 0s3-2 4 0" />
    </Base>
  );
}

export function PinIcon(props) {
  return (
    <Base {...props}>
      <path d="M12 21s-6.5-6.1-6.5-11A6.5 6.5 0 0 1 18.5 10c0 4.9-6.5 11-6.5 11z" />
      <circle cx="12" cy="10" r="2.3" />
    </Base>
  );
}

export function TagIcon(props) {
  return (
    <Base {...props}>
      <path d="M12 3h6a2 2 0 0 1 2 2v6l-9 9-8-8 9-9z" />
      <circle cx="16" cy="8" r="1.3" fill="currentColor" stroke="none" />
    </Base>
  );
}

export function WrenchIcon(props) {
  return (
    <Base {...props}>
      <path d="M15 6a4 4 0 0 0-5.3 4.6L4 16.3V19h2.7l5.7-5.7A4 4 0 0 0 17 8l-3 3-2-2 3-3z" />
    </Base>
  );
}

export function PullIcon(props) {
  return (
    <Base {...props}>
      <rect x="4" y="4" width="4" height="16" rx="1.5" />
      <path d="M8 8h9a3 3 0 0 1 3 3v2a3 3 0 0 1-3 3H8" />
    </Base>
  );
}

// Maps a "Hardware Description" value from the dataset to the closest icon —
// falls back to a generic wrench for anything not explicitly listed.
const DESCRIPTION_ICON_RULES = [
  [/hinge/i, HingeIcon],
  [/closer/i, CloserIcon],
  [/kick\s*plate/i, KickplateIcon],
  [/threshold/i, ThresholdIcon],
  [/(weatherstrip|seal|silencer|astragal)/i, SealIcon],
  [/(pull|push)\s*plate|edge pull|flush pull/i, PullIcon],
  [/(lock|deadbolt|cylinder|latch|dummy|bolt)/i, LockIcon],
  [/(key|viewer)/i, KeyIcon],
];

export function HardwareDescriptionIcon({ value, className = 'h-4 w-4' }) {
  for (const [pattern, Icon] of DESCRIPTION_ICON_RULES) {
    if (pattern.test(value || '')) return <Icon className={className} />;
  }
  return <WrenchIcon className={className} />;
}

export function LockIcon(props) {
  return (
    <Base {...props}>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </Base>
  );
}
