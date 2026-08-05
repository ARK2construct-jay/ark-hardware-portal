import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar.jsx';
import { api } from '../lib/api.js';
import { humanizeField, formatCellValue } from '../lib/format.js';
import {
  TagIcon,
  WrenchIcon,
  PinIcon,
  DoorIcon,
  HingeIcon,
  KeyIcon,
  HardwareDescriptionIcon,
} from '../components/icons.jsx';

function isDescriptionColumn(col) {
  return col.replace(/\s+/g, '').toLowerCase() === 'hardwaredescription';
}

// These fields are already represented by the 3 selectors above the results
// table, so they're hidden from the result columns to avoid repeating the
// same value in every row.
const HIDDEN_RESULT_FIELDS = new Set([
  '_id',
  '__v',
  'brand',
  'Brand',
  'hardwareType',
  'Hardware',
  'location',
  'Location',
]);

const STEPS = [
  { key: 'brand', label: 'Select Brand', Icon: TagIcon },
  { key: 'hardwareType', label: 'Select Hardware Type', Icon: WrenchIcon },
  { key: 'location', label: 'Select Location', Icon: PinIcon },
];

export default function Dashboard() {
  const [selection, setSelection] = useState({ brand: '', hardwareType: '', location: '' });
  const [options, setOptions] = useState({ brand: [], hardwareType: [], location: [] });
  const [optionsLoading, setOptionsLoading] = useState({ brand: true, hardwareType: false, location: false });
  const [error, setError] = useState('');

  const [results, setResults] = useState(null);
  const [resultsLoading, setResultsLoading] = useState(false);

  // Step 1: brand options load once.
  useEffect(() => {
    setOptionsLoading((s) => ({ ...s, brand: true }));
    api
      .hardwareOptions('brand')
      .then((data) => setOptions((o) => ({ ...o, brand: data.options })))
      .catch((err) => setError(err.message))
      .finally(() => setOptionsLoading((s) => ({ ...s, brand: false })));
  }, []);

  // Step 2: hardware type options depend on the chosen brand.
  useEffect(() => {
    if (!selection.brand) {
      setOptions((o) => ({ ...o, hardwareType: [], location: [] }));
      return;
    }
    setOptionsLoading((s) => ({ ...s, hardwareType: true }));
    setError('');
    api
      .hardwareOptions('hardwareType', { brand: selection.brand })
      .then((data) => setOptions((o) => ({ ...o, hardwareType: data.options })))
      .catch((err) => setError(err.message))
      .finally(() => setOptionsLoading((s) => ({ ...s, hardwareType: false })));
  }, [selection.brand]);

  // Step 3: location options depend on brand + hardware type.
  useEffect(() => {
    if (!selection.brand || !selection.hardwareType) {
      setOptions((o) => ({ ...o, location: [] }));
      return;
    }
    setOptionsLoading((s) => ({ ...s, location: true }));
    setError('');
    api
      .hardwareOptions('location', { brand: selection.brand, hardwareType: selection.hardwareType })
      .then((data) => setOptions((o) => ({ ...o, location: data.options })))
      .catch((err) => setError(err.message))
      .finally(() => setOptionsLoading((s) => ({ ...s, location: false })));
  }, [selection.brand, selection.hardwareType]);

  const handleSelect = (step, value) => {
    setResults(null);
    setSelection((s) => {
      const next = { ...s, [step]: value };
      // Changing an earlier step clears the ones after it.
      if (step === 'brand') {
        next.hardwareType = '';
        next.location = '';
      } else if (step === 'hardwareType') {
        next.location = '';
      }
      return next;
    });
  };

  const allSelected = selection.brand && selection.hardwareType && selection.location;

  const handleGetResults = async () => {
    setResultsLoading(true);
    setError('');
    try {
      const data = await api.hardwareResults(selection);
      setResults(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setResultsLoading(false);
    }
  };

  // Real MongoDB rows sometimes have the same logical column stored under
  // two different raw field names (different casing/spacing, e.g.
  // "Hardware Description" and "hardwareDescription") — a leftover from the
  // original spreadsheet import. Group raw keys by their humanized label so
  // each logical column only shows up once, and merge whichever raw key
  // actually has a value for a given row.
  const columns = [];
  if (results?.items?.length) {
    const byLabel = new Map();
    for (const item of results.items) {
      for (const key of Object.keys(item)) {
        if (HIDDEN_RESULT_FIELDS.has(key)) continue;
        const label = humanizeField(key);
        if (!byLabel.has(label)) {
          byLabel.set(label, []);
          columns.push({ label, rawKeys: byLabel.get(label) });
        }
        const rawKeys = byLabel.get(label);
        if (!rawKeys.includes(key)) rawKeys.push(key);
      }
    }
  }

  function getMergedValue(item, rawKeys) {
    for (const key of rawKeys) {
      const value = item[key];
      if (value !== null && value !== undefined && value !== '') return value;
    }
    return undefined;
  }

  return (
    <div className="min-h-screen bg-page">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 px-6 py-7 mb-6">
          <DoorIcon className="absolute -right-2 -top-4 h-32 w-32 text-white/10 rotate-6" strokeWidth={1} />
          <HingeIcon className="absolute right-24 bottom-0 h-20 w-20 text-white/10 -rotate-12" strokeWidth={1} />
          <KeyIcon className="absolute left-[45%] -bottom-6 h-16 w-16 text-white/10 rotate-12" strokeWidth={1} />
          <h1 className="relative text-2xl font-semibold text-white tracking-tight">Hardware Selection</h1>
          <p className="relative text-sm text-white/80 mt-1 max-w-md">
            Pick a brand, hardware type and door location to see the matching hardware set.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-critical/20 bg-critical/10 text-critical px-3.5 py-2.5 text-sm">
            {error}
          </div>
        )}

        <div className="bg-surface border border-hairline rounded-xl p-6 space-y-5">
          {STEPS.map((step, i) => {
            const isActive = i === 0 || selection[STEPS[i - 1].key];
            const isDone = !!selection[step.key];
            return (
              <div key={step.key} className={!isActive ? 'opacity-50 pointer-events-none' : ''}>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                      isDone ? 'bg-brand-500 text-white' : 'bg-page border border-hairline text-ink-muted'
                    }`}
                  >
                    {isDone ? <step.Icon className="h-3.5 w-3.5" /> : i + 1}
                  </span>
                  <span className="text-sm font-medium text-ink">
                    Step {i + 1}: {step.label}
                  </span>
                </div>
                <select
                  value={selection[step.key]}
                  onChange={(e) => handleSelect(step.key, e.target.value)}
                  disabled={!isActive || optionsLoading[step.key]}
                  className="w-full rounded-lg border border-hairline bg-white px-3.5 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition disabled:bg-page"
                >
                  <option value="">
                    {optionsLoading[step.key] ? 'Loading…' : `— Select ${humanizeField(step.key)} —`}
                  </option>
                  {options[step.key].map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}

          <button
            onClick={handleGetResults}
            disabled={!allSelected || resultsLoading}
            className="w-full rounded-lg bg-brand-500 hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium text-sm py-2.5 transition"
          >
            {resultsLoading ? 'Loading results…' : 'Get Results'}
          </button>
        </div>

        {results && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-ink">
                {results.total} hardware item{results.total === 1 ? '' : 's'} found
              </h2>
              <span className="text-xs text-ink-muted">
                {selection.brand} · {selection.hardwareType} · {selection.location}
              </span>
            </div>

            {results.items.length === 0 ? (
              <div className="bg-surface border border-hairline rounded-xl px-4 py-10 text-center text-ink-muted text-sm">
                No hardware found for this exact combination.
              </div>
            ) : (
              <div className="bg-surface border border-hairline rounded-xl overflow-hidden">
                <table className="w-full table-fixed text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-hairline bg-page/60">
                      {columns.map((col) => (
                        <th
                          key={col.label}
                          className="text-left font-medium text-ink-muted uppercase text-[10px] sm:text-xs tracking-wide px-2.5 sm:px-3 py-2.5 break-words"
                        >
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {results.items.map((item) => (
                      <tr key={item._id} className="border-b border-hairline last:border-0 hover:bg-page/50 transition align-top">
                        {columns.map((col) => {
                          const value = getMergedValue(item, col.rawKeys);
                          return (
                            <td key={col.label} className="px-2.5 sm:px-3 py-2.5 text-ink break-words">
                              {isDescriptionColumn(col.label) ? (
                                <span className="flex items-start gap-1.5">
                                  <span className="h-5 w-5 rounded-md bg-brand-50 text-brand-600 flex items-center justify-center shrink-0 mt-0.5">
                                    <HardwareDescriptionIcon value={value} className="h-3.5 w-3.5" />
                                  </span>
                                  <span>{formatCellValue(value)}</span>
                                </span>
                              ) : (
                                formatCellValue(value)
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
