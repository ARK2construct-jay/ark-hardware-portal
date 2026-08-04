import { connectToDatabase } from '../_lib/db.js';
import { User } from '../_lib/models.js';
import { requireAdmin } from '../_lib/auth.js';

// Admin-only user management: list everyone, disable/enable an account, or
// delete one outright. This is how access actually gets revoked — deleting
// or disabling here takes effect on that person's very next request, because
// every protected route re-checks the `disabled` flag straight from the
// database rather than trusting anything baked into their session cookie.
export default async function handler(req, res) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  try {
    await connectToDatabase();

    if (req.method === 'GET') {
      const users = await User.find({}, { password: 0, failedLoginAttempts: 0 })
        .sort({ createdAt: -1 })
        .lean();

      res.status(200).json({
        users: users.map((u) => ({
          id: u._id,
          fullName: u.fullName,
          email: u.email,
          username: u.username,
          isAdmin: !!u.isAdmin,
          disabled: !!u.disabled,
          createdAt: u.createdAt,
        })),
      });
      return;
    }

    if (req.method === 'PATCH') {
      const { userId, disabled, isAdmin } = req.body || {};

      if (!userId) {
        res.status(400).json({ error: 'userId is required.' });
        return;
      }

      if (String(userId) === String(admin._id)) {
        res.status(400).json({ error: 'You cannot change your own admin/disabled status.' });
        return;
      }

      const update = {};
      if (typeof disabled === 'boolean') update.disabled = disabled;
      if (typeof isAdmin === 'boolean') update.isAdmin = isAdmin;

      if (Object.keys(update).length === 0) {
        res.status(400).json({ error: 'Nothing to update.' });
        return;
      }

      const user = await User.findByIdAndUpdate(userId, update, { new: true }).lean();
      if (!user) {
        res.status(404).json({ error: 'User not found.' });
        return;
      }

      res.status(200).json({
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          username: user.username,
          isAdmin: !!user.isAdmin,
          disabled: !!user.disabled,
          createdAt: user.createdAt,
        },
      });
      return;
    }

    if (req.method === 'DELETE') {
      const { userId } = req.body || {};

      if (!userId) {
        res.status(400).json({ error: 'userId is required.' });
        return;
      }

      if (String(userId) === String(admin._id)) {
        res.status(400).json({ error: 'You cannot delete your own account.' });
        return;
      }

      const result = await User.findByIdAndDelete(userId);
      if (!result) {
        res.status(404).json({ error: 'User not found.' });
        return;
      }

      res.status(200).json({ ok: true });
      return;
    }

    res.status(405).json({ error: 'Method not allowed.' });
  } catch (err) {
    console.error('admin/users error:', err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
}
