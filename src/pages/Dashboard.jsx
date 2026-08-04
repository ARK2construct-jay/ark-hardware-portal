import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar.jsx';
import { api } from '../lib/api.js';
import { humanizeField, formatCellValue } from '../lib/format.js';

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
  { key: 'brand', label: 'Select Brand' },
  { key: 'hardwareType', label: 'Select Hardware Type' },
  { key: 'location', label: 'Select Location' },
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

  const columns = results?.items?.length
    ? [...new Set(results.items.flatMap((item) => Object.keys(item)))].filter(
        (k) => !HIDDEN_RESULT_FIELDS.has(k)
      )
    : [];

  return (
    <div className="min-h-screen bg-page">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-ink tracking-tight">Hardware Selection</h1>
          <p className="text-sm text-ink-secondary mt-1">
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
                    className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                      isDone ? 'bg-brand-500 text-white' : 'bg-page border border-hairline text-ink-muted'
                    }`}
                  >
                    {i + 1}
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
          <div className="mt-6 bg-surface border border-hairline rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-hairline flex items-center justify-between">
              <h2 className="text-sm font-semibold text-ink">
                {results.total} hardware item{results.total === 1 ? '' : 's'} found
              </h2>
              <span className="text-xs text-ink-muted">
                {selection.brand} · {selection.hardwareType} · {selection.location}
              </span>
            </div>

            {results.items.length === 0 ? (
              <div className="px-4 py-10 text-center text-ink-muted text-sm">
                No hardware found for this exact combination.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-hairline bg-page/60">
                      {columns.map((col) => (
                        <th
                          key={col}
                          className="text-left font-medium text-ink-muted uppercase text-xs tracking-wide px-4 py-3 whitespace-nowrap"
                        >
                          {humanizeField(col)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {results.items.map((item) => (
                      <tr key={item._id} className="border-b border-hairline last:border-0 hover:bg-page/50 transition">
                        {columns.map((col) => (
                          <td key={col} className="px-4 py-3 text-ink whitespace-nowrap">
                            {formatCellValue(item[col])}
                          </td>
                        ))}
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
