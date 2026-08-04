// The allegion_set collection was imported from spreadsheets over time, so the
// same concept sometimes lives under two differently-cased field names (e.g.
// "brand" and "Brand"). We treat each wizard dimension as a GROUP of possible
// underlying field names and match/union across all of them, so no real data
// is silently missed just because of a casing inconsistency.
export const FIELD_GROUPS = {
  brand: ['brand', 'Brand'],
  hardwareType: ['hardwareType', 'Hardware'],
  location: ['location', 'Location'],
};

// Some rows in the collection are corrupted leftover header rows from the
// original spreadsheet import (e.g. a document whose "brand" field is
// literally the text "Brand"). These are never real hardware data, so they're
// filtered out of every dropdown and result set.
const JUNK_VALUES = new Set([
  'brand',
  'location',
  'hardware',
  'hardware type',
  'hardware description',
  'manufacture',
  'manufacturer',
  'model number',
  'grade 1',
  'grade 2',
  'economical grade',
]);

export function isJunkValue(value) {
  return typeof value !== 'string' || value.trim() === '' || JUNK_VALUES.has(value.trim().toLowerCase());
}

// Builds a Mongo filter from already-selected wizard dimensions, e.g.
// { brand: 'Allegion' } -> { $and: [ { $or: [{brand:'Allegion'},{Brand:'Allegion'}] } ] }
export function buildDimensionFilter(selected) {
  const and = [];
  for (const [dim, value] of Object.entries(selected)) {
    if (!value) continue;
    const fields = FIELD_GROUPS[dim];
    if (!fields) continue;
    and.push({ $or: fields.map((f) => ({ [f]: value })) });
  }
  return and.length > 0 ? { $and: and } : {};
}
