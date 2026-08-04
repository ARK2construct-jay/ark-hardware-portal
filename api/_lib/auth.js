import jwt from 'jsonwebtoken';

const COOKIE_NAME = 'ark_session';
const JWT_SECRET = process.env.JWT_SECRET;
const isProd = process.env.NODE_ENV === 'production';

function requireSecret() {
  if (!JWT_SECRET) {
    throw new Error(
      'JWT_SECRET environment variable is not set. Add it in your Vercel project settings.'
    );
  }
  return JWT_SECRET;
}

export function signSession(user) {
  return jwt.sign(
    { sub: String(user._id), email: user.email, username: user.username, fullName: user.fullName },
    requireSecret(),
    { expiresIn: '7d' }
  );
}

// Minimal, dependency-free Set-Cookie serializer — only the attributes this
// app actually needs (httpOnly session cookie), so we don't depend on a
// third-party package's exact API shape.
function buildSetCookie(name, value, { maxAge } = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  parts.push('Path=/');
  parts.push('HttpOnly');
  parts.push('SameSite=Lax');
  if (isProd) parts.push('Secure');
  if (typeof maxAge === 'number') parts.push(`Max-Age=${maxAge}`);
  return parts.join('; ');
}

export function setSessionCookie(res, token) {
  res.setHeader('Set-Cookie', buildSetCookie(COOKIE_NAME, token, { maxAge: 60 * 60 * 24 * 7 }));
}

export function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', buildSetCookie(COOKIE_NAME, '', { maxAge: 0 }));
}

function parseCookieHeader(header) {
  const out = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (!key) continue;
    try {
      out[key] = decodeURIComponent(value);
    } catch {
      out[key] = value;
    }
  }
  return out;
}

// Reads the session cookie from the request and returns the decoded payload,
// or null if there is no valid session. Never throws.
export function getSession(req) {
  const raw = req.headers?.cookie;
  if (!raw) return null;
  const cookies = parseCookieHeader(raw);
  const token = cookies[COOKIE_NAME];
  if (!token) return null;
  try {
    return jwt.verify(token, requireSecret());
  } catch {
    return null;
  }
}

// Helper for API routes that require a logged-in user. Returns the session on
// success, or writes a 401 response and returns null (caller should `return`
// immediately when this returns null).
export function requireAuth(req, res) {
  const session = getSession(req);
  if (!session) {
    res.status(401).json({ error: 'Not authenticated.' });
    return null;
  }
  return session;
}
