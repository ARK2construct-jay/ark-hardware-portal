import { useEffect, useMemo, useState } from 'react';
import Navbar from '../components/Navbar.jsx';
import StatTile from '../components/StatTile.jsx';
import { api } from '../lib/api.js';
import { humanizeField, formatCellValue } from '../lib/format.js';

const PAGE_SIZE = 25;
const MAX_VISIBLE_FILTERS = 4;

export default function Dashboard() {
  const [meta, setMeta] = useState({ fields: [], totalCount: 0 });
  const [metaLoading, setMetaLoading] = useState(true);
  const [showAllFilters, setShowAllFilters] = useState(false);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({});
  const [page, setPage] = useState(1);

  const [result, setResult] = useState({ items: [], total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Debounce free-text search input.
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    api
      .hardwareMeta()
      .then(setMeta)
      .catch(() => setError('Could not load filter options.'))
      .finally(() => setMetaLoading(false));
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, filters]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    const params = { page: String(page), limit: String(PAGE_SIZE) };
    if (search) params.q = search;
    for (const [key, value] of Object.entries(filters)) {
      if (value) params[key] = value;
    }

    api
      .hardwareList(params)
      .then((data) => {
        if (!cancelled) setResult(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [search, filters, page]);

  const selectFields = useMemo(() => meta.fields.filter((f) => f.type === 'select'), [meta.fields]);
  const visibleFilterFields = showAllFilters ? selectFields : selectFields.slice(0, MAX_VISIBLE_FILTERS);

  const columns = useMemo(() => {
    const keys = new Set();
    for (const item of result.items) {
      for (const key of Object.keys(item)) {
        if (key === '_id' || key === '__v') continue;
        keys.add(key);
      }
    }
    return [...keys];
  }, [result.items]);

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const clearFilters = () => {
    setFilters({});
    setSearchInput('');
  };

  return (
    <div className="min-h-screen bg-page">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-ink tracking-tight">Hardware Dataset</h1>
          <p className="text-sm text-ink-secondary mt-1">
            Search and filter the ARK hardware selection catalog.
          </p>
        </div>

        <div className="flex flex-wrap gap-4 mb-6">
          <StatTile label="Total items" value={metaLoading ? '…' : meta.totalCount.toLocaleString()} />
          <StatTile label="Matching results" value={loading ? '…' : result.total.toLocaleString()} accent="good" />
          <StatTile label="Active filters" value={activeFilterCount} />
        </div>

        <div className="bg-surface border border-hairline rounded-xl p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3 mb-3">
            <div className="relative flex-1">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
                />
              </svg>
              <input
                type="search"
                placeholder="Search hardware by any field…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full rounded-lg border border-hairline bg-white pl-9 pr-3.5 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition"
              />
            </div>
            {activeFilterCount > 0 || search ? (
              <button
                onClick={clearFilters}
                className="text-sm font-medium text-ink-secondary hover:text-critical border border-hairline rounded-lg px-3.5 py-2.5 transition whitespace-nowrap"
              >
                Clear all
              </button>
            ) : null}
          </div>

          {selectFields.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {visibleFilterFields.map((field) => (
                <select
                  key={field.name}
                  value={filters[field.name] || ''}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, [field.name]: e.target.value }))
                  }
                  className="rounded-lg border border-hairline bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition"
                >
                  <option value="">All {humanizeField(field.name)}</option>
                  {field.options.map((opt) => (
                    <option key={String(opt)} value={opt}>
                      {String(opt)}
                    </option>
                  ))}
                </select>
              ))}
              {selectFields.length > MAX_VISIBLE_FILTERS && (
                <button
                  onClick={() => setShowAllFilters((v) => !v)}
                  className="text-sm font-medium text-brand-600 hover:underline px-1"
                >
                  {showAllFilters ? 'Fewer filters' : `+${selectFields.length - MAX_VISIBLE_FILTERS} more filters`}
                </button>
              )}
            </div>
          )}
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-critical/20 bg-critical/10 text-critical px-3.5 py-2.5 text-sm">
            {error}
          </div>
        )}

        <div className="bg-surface border border-hairline rounded-xl overflow-hidden">
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
                  {columns.length === 0 && (
                    <th className="text-left font-medium text-ink-muted uppercase text-xs tracking-wide px-4 py-3">
                      Item
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={Math.max(columns.length, 1)} className="px-4 py-10 text-center text-ink-muted">
                      Loading…
                    </td>
                  </tr>
                ) : result.items.length === 0 ? (
                  <tr>
                    <td colSpan={Math.max(columns.length, 1)} className="px-4 py-10 text-center text-ink-muted">
                      No hardware items match your search.
                    </td>
                  </tr>
                ) : (
                  result.items.map((item) => (
                    <tr key={item._id} className="border-b border-hairline last:border-0 hover:bg-page/50 transition">
                      {columns.map((col) => (
                        <td key={col} className="px-4 py-3 text-ink whitespace-nowrap">
                          {formatCellValue(item[col])}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between px-4 py-3 border-t border-hairline">
            <span className="text-xs text-ink-muted">
              Page {result.page || page} of {result.totalPages || 1}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="text-sm font-medium text-ink-secondary disabled:opacity-40 border border-hairline rounded-lg px-3 py-1.5 hover:border-brand-500 transition"
              >
                Previous
              </button>
              <button
                disabled={page >= (result.totalPages || 1) || loading}
                onClick={() => setPage((p) => p + 1)}
                className="text-sm font-medium text-ink-secondary disabled:opacity-40 border border-hairline rounded-lg px-3 py-1.5 hover:border-brand-500 transition"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
