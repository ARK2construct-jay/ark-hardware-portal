// Turns a raw Mongo field name like "unit_price" or "doorThickness" into a
// readable column/label like "Unit Price" / "Door Thickness".
export function humanizeField(name) {
  const spaced = String(name)
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim();
  return spaced
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function formatCellValue(value) {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object') {
    if (value.$date) return new Date(value.$date).toLocaleDateString();
    return JSON.stringify(value);
  }
  return String(value);
}
