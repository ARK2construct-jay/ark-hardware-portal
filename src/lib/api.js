async function request(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });

  const contentType = res.headers.get('content-type') || '';
  const body = contentType.includes('application/json') ? await res.json() : null;

  if (!res.ok) {
    const message = body?.error || `Request failed (${res.status})`;
    const error = new Error(message);
    error.status = res.status;
    throw error;
  }

  return body;
}

export const api = {
  me: () => request('/me'),
  register: (data) => request('/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data) => request('/login', { method: 'POST', body: JSON.stringify(data) }),
  logout: () => request('/logout', { method: 'POST' }),
  forgotPassword: (email) =>
    request('/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (data) =>
    request('/reset-password', { method: 'POST', body: JSON.stringify(data) }),
  hardwareOptions: (dimension, filters = {}) =>
    request(`/hardware/options?${new URLSearchParams({ dimension, ...filters }).toString()}`),
  hardwareResults: (params) => request(`/hardware/results?${new URLSearchParams(params).toString()}`),
  adminListUsers: () => request('/admin/users'),
  adminUpdateUser: (userId, patch) =>
    request('/admin/users', { method: 'PATCH', body: JSON.stringify({ userId, ...patch }) }),
  adminDeleteUser: (userId) =>
    request('/admin/users', { method: 'DELETE', body: JSON.stringify({ userId }) }),
};
