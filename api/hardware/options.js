import { connectToDatabase } from '../_lib/db.js';
import { Hardware } from '../_lib/models.js';
import { requireActiveUser } from '../_lib/auth.js';
import { FIELD_GROUPS, buildDimensionFilter, isJunkValue } from '../_lib/hardwareQuery.js';

const DIMENSION_ORDER = ['brand', 'hardwareType', 'location'];

// A brand/hardwareType is only a real, usable choice if picking it can still
// lead all the way to a location and an actual result. Some rows in the
// imported data have a brand filled in but no hardware type or location on
// that same row (a dead end — e.g. a stray "ABB" value) which would
// otherwise show up as a selectable option and then leave the next step(s)
// empty. This checks that every dimension AFTER the one being listed is
// also present (non-junk) on the same document, so only options that lead
// somewhere real are ever shown.
function hasValidDownstream(doc, dimension) {
  const idx = DIMENSION_ORDER.indexOf(dimension);
  const downstreamDims = DIMENSION_ORDER.slice(idx + 1);
  return downstreamDims.every((dim) => FIELD_GROUPS[dim].some((f) => !isJunkValue(doc[f])));
}

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
    // Project every dimension's fields (not just this step's) so we can also
    // check downstream validity per document below.
    const allFields = Object.values(FIELD_GROUPS).flat();
    const projection = allFields.reduce((proj, f) => ({ ...proj, [f]: 1 }), {});

    const docs = await Hardware.find(match, projection).lean();

    const values = new Set();
    for (const doc of docs) {
      if (!hasValidDownstream(doc, dimension)) continue;
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
