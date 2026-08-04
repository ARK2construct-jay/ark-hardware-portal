import { connectToDatabase } from '../_lib/db.js';
import { Hardware } from '../_lib/models.js';
import { requireAuth } from '../_lib/auth.js';

const IGNORED_FIELDS = new Set(['_id', '__v']);
const MAX_DISTINCT_OPTIONS = 50;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  const session = requireAuth(req, res);
  if (!session) return;

  try {
    await connectToDatabase();

    // Sample a chunk of documents to discover the real field names — the
    // collection may not have a rigid schema, so we don't assume one.
    const sample = await Hardware.aggregate([{ $sample: { size: 100 } }]);

    const fieldNames = new Set();
    for (const doc of sample) {
      for (const key of Object.keys(doc)) {
        if (!IGNORED_FIELDS.has(key)) fieldNames.add(key);
      }
    }

    const totalCount = await Hardware.estimatedDocumentCount();

    const fields = [];
    for (const field of fieldNames) {
      const sampleValue = sample.find((d) => d[field] !== undefined)?.[field];
      const isPrimitive =
        sampleValue === null ||
        ['string', 'number', 'boolean'].includes(typeof sampleValue);

      if (!isPrimitive) {
        fields.push({ name: field, type: 'text', options: null });
        continue;
      }

      let distinctValues = [];
      try {
        distinctValues = await Hardware.distinct(field);
      } catch {
        distinctValues = [];
      }

      if (distinctValues.length > 0 && distinctValues.length <= MAX_DISTINCT_OPTIONS) {
        fields.push({
          name: field,
          type: 'select',
          options: distinctValues
            .filter((v) => v !== null && v !== undefined && v !== '')
            .sort((a, b) => String(a).localeCompare(String(b))),
        });
      } else {
        fields.push({ name: field, type: 'text', options: null });
      }
    }

    // Keep a stable, readable order: put common-looking identity fields first.
    fields.sort((a, b) => a.name.localeCompare(b.name));

    res.status(200).json({ fields, totalCount });
  } catch (err) {
    console.error('hardware/meta error:', err);
    res.status(500).json({ error: 'Could not load hardware filters.' });
  }
}
