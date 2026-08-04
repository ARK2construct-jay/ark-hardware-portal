import nodemailer from 'nodemailer';

let transporter;

function getTransporter() {
  if (transporter) return transporter;

  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    throw new Error(
      'GMAIL_USER / GMAIL_APP_PASSWORD environment variables are not set. Add them in your Vercel project settings.'
    );
  }

  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });

  return transporter;
}

export async function sendPasswordResetCode(toEmail, code) {
  const fromUser = process.env.GMAIL_USER;

  await getTransporter().sendMail({
    from: `"ARK Hardware Portal" <${fromUser}>`,
    to: toEmail,
    subject: 'Your ARK Hardware Portal password reset code',
    text: `Your password reset code is: ${code}\n\nThis code expires in 10 minutes. If you did not request a password reset, you can safely ignore this email.`,
    html: `
      <div style="font-family: system-ui, -apple-system, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #fcfcfb; border-radius: 12px; border: 1px solid #e1e0d9;">
        <h2 style="margin: 0 0 8px; color: #0b0b0b; font-size: 20px;">Reset your password</h2>
        <p style="margin: 0 0 24px; color: #52514e; font-size: 15px; line-height: 1.5;">
          Use the code below to reset your ARK Hardware Portal password. It expires in 10 minutes.
        </p>
        <div style="text-align: center; margin: 0 0 24px;">
          <span style="display: inline-block; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #2a78d6; padding: 12px 24px; background: #eaf2fc; border-radius: 8px;">
            ${code}
          </span>
        </div>
        <p style="margin: 0; color: #898781; font-size: 13px; line-height: 1.5;">
          If you did not request a password reset, you can safely ignore this email — your password will not change.
        </p>
      </div>
    `,
  });
}
