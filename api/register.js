import { connectToDatabase } from './_lib/db.js';
import { User } from './_lib/models.js';
import { hashPassword, validatePasswordStrength } from './_lib/password.js';
import { signSession, setSessionCookie } from './_lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  const { fullName, email, username, password } = req.body || {};

  if (!fullName || !email || !username || !password) {
    res.status(400).json({ error: 'Full name, email, username and password are all required.' });
    return;
  }

  const passwordError = validatePasswordStrength(password);
  if (passwordError) {
    res.status(400).json({ error: passwordError });
    return;
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  try {
    await connectToDatabase();

    const existing = await User.findOne({
      $or: [{ email: normalizedEmail }, { username: String(username).trim() }],
    }).lean();

    if (existing) {
      res.status(409).json({
        error:
          existing.email === normalizedEmail
            ? 'An account with this email already exists.'
            : 'This username is already taken.',
      });
      return;
    }

    const passwordHash = await hashPassword(password);

    const user = await User.create({
      fullName: String(fullName).trim(),
      email: normalizedEmail,
      username: String(username).trim(),
      password: passwordHash,
    });

    const token = signSession(user);
    setSessionCookie(res, token);

    res.status(201).json({
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        username: user.username,
      },
    });
  } catch (err) {
    console.error('register error:', err);
    res.status(500).json({ error: 'Something went wrong while creating your account.' });
  }
}
