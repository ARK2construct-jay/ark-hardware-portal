import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const initials = (user?.fullName || user?.username || '?')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <header className="sticky top-0 z-10 bg-surface/90 backdrop-blur border-b border-hairline">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img
            src="/logo.png"
            alt="ARK Simplify"
            className="h-9 w-9 rounded-lg border border-hairline object-contain bg-white"
          />
          <span className="font-semibold text-ink tracking-tight">ARK Hardware Portal</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col items-end leading-tight">
            <span className="text-sm font-medium text-ink">{user?.fullName}</span>
            <span className="text-xs text-ink-muted">{user?.email}</span>
          </div>
          <div className="h-9 w-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-sm font-semibold">
            {initials}
          </div>
          <button
            onClick={handleLogout}
            className="text-sm font-medium text-ink-secondary hover:text-critical border border-hairline hover:border-critical/40 rounded-lg px-3 py-1.5 transition"
          >
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}
