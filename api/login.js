import { connectToDatabase } from './_lib/db.js';
import { User } from './_lib/models.js';
import { verifyPassword, hashPassword } from './_lib/password.js';
import { signSession, setSessionCookie } from './_lib/auth.js';

const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  const { identifier, password } = req.body || {};

  if (!identifier || !password) {
    res.status(400).json({ error: 'Email/username and password are required.' });
    return;
  }

  const normalizedIdentifier = String(identifier).trim().toLowerCase();

  try {
    await connectToDatabase();

    const user = await User.findOne({
      $or: [{ email: normalizedIdentifier }, { username: normalizedIdentifier }],
    });

    // Generic error for unknown users — never reveal whether an account
    // exists, only whether the credentials as a whole were valid.
    if (!user) {
      res.status(401).json({ error: 'Invalid email/username or password.' });
      return;
    }

    if (user.disabled) {
      res.status(403).json({ error: 'This account has been disabled. Contact your administrator.' });
      return;
    }

    if (user.lockUntil && user.lockUntil > new Date()) {
      const minutesLeft = Math.ceil((user.lockUntil - new Date()) / 60000);
      res.status(423).json({
        error: `Too many failed attempts. Try again in ${minutesLeft} minute${minutesLeft === 1 ? '' : 's'}.`,
      });
      return;
    }

    const { ok, needsUpgrade } = await verifyPassword(password, user.password);

    if (!ok) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      if (user.failedLoginAttempts >= MAX_ATTEMPTS) {
        user.lockUntil = new Date(Date.now() + LOCK_MINUTES * 60 * 1000);
        user.failedLoginAttempts = 0;
      }
      await user.save();
      res.status(401).json({ error: 'Invalid email/username or password.' });
      return;
    }

    // Success — reset any lockout tracking, and transparently upgrade legacy
    // plaintext passwords to a bcrypt hash now that we've confirmed it.
    user.failedLoginAttempts = 0;
    user.lockUntil = null;
    if (needsUpgrade) {
      user.password = await hashPassword(password);
    }
    await user.save();

    const token = signSession(user);
    setSessionCookie(res, token);

    res.status(200).json({
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        username: user.username,
        isAdmin: !!user.isAdmin,
      },
    });
  } catch (err) {
    console.error('login error:', err);
    res.status(500).json({ error: 'Something went wrong while logging you in.' });
  }
}
