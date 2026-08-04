import { connectToDatabase } from '../_lib/db.js';
import { Hardware } from '../_lib/models.js';
import { requireAuth } from '../_lib/auth.js';

const RESERVED_PARAMS = new Set(['page', 'limit', 'q']);
const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 25;
const FIELD_CACHE_TTL_MS = 5 * 60 * 1000;

// Cached per warm serverless instance — avoids re-sampling the collection on
// every single request just to know which fields are searchable text.
let stringFieldCache = { fields: null, expiresAt: 0 };

async function getStringFields() {
  if (stringFieldCache.fields && stringFieldCache.expiresAt > Date.now()) {
    return stringFieldCache.fields;
  }
  const sample = await Hardware.aggregate([{ $sample: { size: 100 } }]);
  const fields = new Set();
  for (const doc of sample) {
    for (const [key, value] of Object.entries(doc)) {
      if (key === '_id' || key === '__v') continue;
      if (typeof value === 'string') fields.add(key);
    }
  }
  const result = [...fields];
  stringFieldCache = { fields: result, expiresAt: Date.now() + FIELD_CACHE_TTL_MS };
  return result;
}

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  const session = requireAuth(req, res);
  if (!session) return;

  try {
    await connectToDatabase();

    const { page: pageRaw, limit: limitRaw, q } = req.query || {};
    const page = Math.max(1, parseInt(pageRaw, 10) || 1);
    const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(limitRaw, 10) || DEFAULT_LIMIT));

    const andClauses = [];

    // Any extra query param (not page/limit/q) is treated as an exact-match
    // filter on that field — this is how the dashboard's dropdown filters work.
    for (const [key, value] of Object.entries(req.query || {})) {
      if (RESERVED_PARAMS.has(key) || value === '' || value === undefined) continue;
      andClauses.push({ [key]: value });
    }

    if (q && String(q).trim()) {
      const stringFields = await getStringFields();
      const escaped = escapeRegExp(String(q).trim());
      const regex = new RegExp(escaped, 'i');
      if (stringFields.length > 0) {
        andClauses.push({ $or: stringFields.map((field) => ({ [field]: regex })) });
      }
    }

    const filter = andClauses.length > 0 ? { $and: andClauses } : {};

    const [items, total] = await Promise.all([
      Hardware.find(filter)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Hardware.countDocuments(filter),
    ]);

    res.status(200).json({
      items,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (err) {
    console.error('hardware list error:', err);
    res.status(500).json({ error: 'Could not load hardware data.' });
  }
}
