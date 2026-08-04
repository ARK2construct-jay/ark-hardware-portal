import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar.jsx';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';

function StatusBadge({ disabled }) {
  return disabled ? (
    <span className="inline-flex items-center rounded-full bg-critical/10 text-critical text-xs font-medium px-2 py-0.5">
      Disabled
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full bg-good/10 text-[#006300] text-xs font-medium px-2 py-0.5">
      Active
    </span>
  );
}

export default function Admin() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = () => {
    setLoading(true);
    setError('');
    api
      .adminListUsers()
      .then((data) => setUsers(data.users))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const toggleDisabled = async (u) => {
    setBusyId(u.id);
    setError('');
    try {
      const data = await api.adminUpdateUser(u.id, { disabled: !u.disabled });
      setUsers((list) => list.map((x) => (x.id === u.id ? data.user : x)));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const toggleAdmin = async (u) => {
    setBusyId(u.id);
    setError('');
    try {
      const data = await api.adminUpdateUser(u.id, { isAdmin: !u.isAdmin });
      setUsers((list) => list.map((x) => (x.id === u.id ? data.user : x)));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const deleteUser = async (u) => {
    if (!confirm(`Permanently delete ${u.fullName}'s account? This cannot be undone.`)) return;
    setBusyId(u.id);
    setError('');
    try {
      await api.adminDeleteUser(u.id);
      setUsers((list) => list.filter((x) => x.id !== u.id));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="min-h-screen bg-page">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-ink tracking-tight">Manage Users</h1>
          <p className="text-sm text-ink-secondary mt-1">
            Disable or delete an account to revoke that person's access to the portal — it takes effect
            immediately, even if they're already logged in.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-critical/20 bg-critical/10 text-critical px-3.5 py-2.5 text-sm">
            {error}
          </div>
        )}

        <div className="bg-surface border border-hairline rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-hairline bg-page/60">
                  <th className="text-left font-medium text-ink-muted uppercase text-xs tracking-wide px-4 py-3">Name</th>
                  <th className="text-left font-medium text-ink-muted uppercase text-xs tracking-wide px-4 py-3">Email</th>
                  <th className="text-left font-medium text-ink-muted uppercase text-xs tracking-wide px-4 py-3">Username</th>
                  <th className="text-left font-medium text-ink-muted uppercase text-xs tracking-wide px-4 py-3">Role</th>
                  <th className="text-left font-medium text-ink-muted uppercase text-xs tracking-wide px-4 py-3">Status</th>
                  <th className="text-right font-medium text-ink-muted uppercase text-xs tracking-wide px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-ink-muted">Loading…</td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-ink-muted">No users found.</td>
                  </tr>
                ) : (
                  users.map((u) => {
                    const isSelf = u.id === currentUser?.id;
                    const busy = busyId === u.id;
                    return (
                      <tr key={u.id} className="border-b border-hairline last:border-0">
                        <td className="px-4 py-3 text-ink whitespace-nowrap">
                          {u.fullName} {isSelf && <span className="text-xs text-ink-muted">(you)</span>}
                        </td>
                        <td className="px-4 py-3 text-ink-secondary whitespace-nowrap">{u.email}</td>
                        <td className="px-4 py-3 text-ink-secondary whitespace-nowrap">{u.username}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {u.isAdmin ? (
                            <span className="inline-flex items-center rounded-full bg-brand-50 text-brand-600 text-xs font-medium px-2 py-0.5">
                              Admin
                            </span>
                          ) : (
                            <span className="text-xs text-ink-muted">User</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <StatusBadge disabled={u.disabled} />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right space-x-2">
                          {!isSelf && (
                            <>
                              <button
                                onClick={() => toggleDisabled(u)}
                                disabled={busy}
                                className="text-xs font-medium text-ink-secondary hover:text-brand-600 border border-hairline rounded-md px-2.5 py-1.5 disabled:opacity-50 transition"
                              >
                                {u.disabled ? 'Enable' : 'Disable'}
                              </button>
                              <button
                                onClick={() => toggleAdmin(u)}
                                disabled={busy}
                                className="text-xs font-medium text-ink-secondary hover:text-brand-600 border border-hairline rounded-md px-2.5 py-1.5 disabled:opacity-50 transition"
                              >
                                {u.isAdmin ? 'Remove admin' : 'Make admin'}
                              </button>
                              <button
                                onClick={() => deleteUser(u)}
                                disabled={busy}
                                className="text-xs font-medium text-critical hover:text-critical border border-critical/30 rounded-md px-2.5 py-1.5 disabled:opacity-50 transition"
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
