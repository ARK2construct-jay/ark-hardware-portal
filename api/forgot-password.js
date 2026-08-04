import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from './_lib/db.js';
import { User, PasswordReset } from './_lib/models.js';
import { sendPasswordResetCode } from './_lib/mailer.js';

const CODE_TTL_MINUTES = 10;
const RESEND_COOLDOWN_SECONDS = 60;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  const { email } = req.body || {};
  if (!email) {
    res.status(400).json({ error: 'Email is required.' });
    return;
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  // Always return the same generic response regardless of whether the email
  // exists, so this endpoint can't be used to discover registered accounts.
  const genericResponse = {
    message: 'If an account exists for this email, a reset code has been sent.',
  };

  try {
    await connectToDatabase();

    const user = await User.findOne({ email: normalizedEmail }).lean();
    if (!user) {
      res.status(200).json(genericResponse);
      return;
    }

    const recent = await PasswordReset.findOne({ email: normalizedEmail })
      .sort({ createdAt: -1 })
      .lean();

    if (recent && Date.now() - new Date(recent.createdAt).getTime() < RESEND_COOLDOWN_SECONDS * 1000) {
      res.status(429).json({
        error: `Please wait a bit before requesting another code.`,
      });
      return;
    }

    const code = crypto.randomInt(100000, 1000000).toString();
    const codeHash = await bcrypt.hash(code, 10);

    await PasswordReset.create({
      email: normalizedEmail,
      codeHash,
      expiresAt: new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000),
      used: false,
      attempts: 0,
    });

    await sendPasswordResetCode(normalizedEmail, code);

    res.status(200).json(genericResponse);
  } catch (err) {
    console.error('forgot-password error:', err);
    // Still return the generic response so we don't leak internal errors,
    // but surface a 500 so the frontend can show a "try again" state.
    res.status(500).json({ error: 'Could not send the reset code right now. Please try again shortly.' });
  }
}
