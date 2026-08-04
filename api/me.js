import { requireAuth } from './_lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  const session = requireAuth(req, res);
  if (!session) return;

  res.status(200).json({
    user: {
      id: session.sub,
      email: session.email,
      username: session.username,
      fullName: session.fullName,
    },
  });
}
