import { connectToDatabase } from '../_lib/db.js';
import { Hardware } from '../_lib/models.js';
import { requireAuth } from '../_lib/auth.js';
import { buildDimensionFilter } from '../_lib/hardwareQuery.js';

const MAX_RESULTS = 500;

// The "Get Results" step: given all three selections, return every matching
// hardware row (a full hardware set for that brand + type + location usually
// has several rows — one per component: hinges, closer, lockset, etc).
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  const session = requireAuth(req, res);
  if (!session) return;

  const { brand, hardwareType, location } = req.query || {};

  if (!brand || !hardwareType || !location) {
    res.status(400).json({ error: 'brand, hardwareType and location are all required.' });
    return;
  }

  try {
    await connectToDatabase();

    const match = buildDimensionFilter({ brand, hardwareType, location });
    const items = await Hardware.find(match).limit(MAX_RESULTS).lean();

    res.status(200).json({ items, total: items.length });
  } catch (err) {
    console.error('hardware/results error:', err);
    res.status(500).json({ error: 'Could not load results.' });
  }
}
