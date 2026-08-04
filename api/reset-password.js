import bcrypt from 'bcryptjs';
import { connectToDatabase } from './_lib/db.js';
import { User, PasswordReset } from './_lib/models.js';
import { hashPassword, validatePasswordStrength } from './_lib/password.js';

const MAX_CODE_ATTEMPTS = 5;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  const { email, code, newPassword } = req.body || {};

  if (!email || !code || !newPassword) {
    res.status(400).json({ error: 'Email, code and new password are all required.' });
    return;
  }

  const passwordError = validatePasswordStrength(newPassword);
  if (passwordError) {
    res.status(400).json({ error: passwordError });
    return;
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  try {
    await connectToDatabase();

    const reset = await PasswordReset.findOne({ email: normalizedEmail, used: false }).sort({
      createdAt: -1,
    });

    if (!reset) {
      res.status(400).json({ error: 'No pending reset request for this email. Please request a new code.' });
      return;
    }

    if (reset.expiresAt < new Date()) {
      res.status(400).json({ error: 'This code has expired. Please request a new one.' });
      return;
    }

    if (reset.attempts >= MAX_CODE_ATTEMPTS) {
      res.status(429).json({ error: 'Too many incorrect attempts. Please request a new code.' });
      return;
    }

    const codeMatches = await bcrypt.compare(String(code).trim(), reset.codeHash);

    if (!codeMatches) {
      reset.attempts += 1;
      await reset.save();
      res.status(400).json({ error: 'Incorrect code. Please try again.' });
      return;
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      res.status(400).json({ error: 'Account not found.' });
      return;
    }

    user.password = await hashPassword(newPassword);
    user.failedLoginAttempts = 0;
    user.lockUntil = null;
    await user.save();

    reset.used = true;
    await reset.save();

    res.status(200).json({ message: 'Password updated. You can now log in with your new password.' });
  } catch (err) {
    console.error('reset-password error:', err);
    res.status(500).json({ error: 'Something went wrong while resetting your password.' });
  }
}
