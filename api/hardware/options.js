import { connectToDatabase } from '../_lib/db.js';
import { Hardware } from '../_lib/models.js';
import { requireActiveUser } from '../_lib/auth.js';
import { FIELD_GROUPS, buildDimensionFilter, isJunkValue } from '../_lib/hardwareQuery.js';

// Powers each dropdown in the 3-step wizard (Brand -> Hardware Type ->
// Location). Every step after the first is filtered by whatever was already
// picked, so the options always reflect real combinations in the data.
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  const user = await requireActiveUser(req, res);
  if (!user) return;

  const { dimension, brand, hardwareType } = req.query || {};

  if (!FIELD_GROUPS[dimension]) {
    res.status(400).json({ error: 'dimension must be one of: brand, hardwareType, location.' });
    return;
  }

  try {
    await connectToDatabase();

    const selected = {};
    if (dimension !== 'brand' && brand) selected.brand = brand;
    if (dimension === 'location' && hardwareType) selected.hardwareType = hardwareType;

    const match = buildDimensionFilter(selected);
    const fields = FIELD_GROUPS[dimension];
    const projection = fields.reduce((proj, f) => ({ ...proj, [f]: 1 }), {});

    const docs = await Hardware.find(match, projection).lean();

    const values = new Set();
    for (const doc of docs) {
      for (const f of fields) {
        const v = doc[f];
        if (!isJunkValue(v)) values.add(String(v).trim());
      }
    }

    res.status(200).json({
      dimension,
      options: [...values].sort((a, b) => a.localeCompare(b)),
    });
  } catch (err) {
    console.error('hardware/options error:', err);
    res.status(500).json({ error: 'Could not load options.' });
  }
}
