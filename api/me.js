import { requireActiveUser } from './_lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  const user = await requireActiveUser(req, res);
  if (!user) return;

  res.status(200).json({
    user: {
      id: user._id,
      email: user.email,
      username: user.username,
      fullName: user.fullName,
      isAdmin: !!user.isAdmin,
    },
  });
}
