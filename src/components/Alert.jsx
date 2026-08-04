export default function Alert({ type = 'error', children }) {
  if (!children) return null;

  const styles =
    type === 'error'
      ? 'bg-critical/10 text-critical border-critical/20'
      : 'bg-good/10 text-[#006300] border-good/20';

  return (
    <div className={`mb-4 rounded-lg border px-3.5 py-2.5 text-sm ${styles}`}>
      {children}
    </div>
  );
}
