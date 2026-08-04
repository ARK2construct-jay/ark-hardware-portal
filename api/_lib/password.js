import bcrypt from 'bcryptjs';

const BCRYPT_PREFIX = /^\$2[aby]\$/;

export function isBcryptHash(value) {
  return typeof value === 'string' && BCRYPT_PREFIX.test(value);
}

export async function hashPassword(plain) {
  return bcrypt.hash(plain, 10);
}

// Verifies a candidate password against whatever is stored. Some legacy
// records (from before this rebuild) store the password in plaintext instead
// of a bcrypt hash. We support both so existing users can keep logging in
// with their current password, and report whether an upgrade is needed so the
// caller can transparently re-hash it on successful login.
export async function verifyPassword(candidate, stored) {
  if (isBcryptHash(stored)) {
    const ok = await bcrypt.compare(candidate, stored);
    return { ok, needsUpgrade: false };
  }
  // Legacy plaintext comparison.
  const ok = candidate === stored;
  return { ok, needsUpgrade: ok };
}

export function validatePasswordStrength(password) {
  if (typeof password !== 'string' || password.length < 8) {
    return 'Password must be at least 8 characters long.';
  }
  return null;
}
