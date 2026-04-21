import { MARKETS } from "../../lib/constants";

export function FilterBar({ filters, setFilters, sortKey, setSortKey }) {
  return (
    <div className="mb-6 flex flex-wrap items-end gap-4 rounded-lg border border-zinc-800 bg-zinc-900/30 p-4 dark:border-zinc-200 dark:bg-zinc-50">
      <label className="flex flex-col text-xs text-zinc-400 dark:text-zinc-600">
        Country
        <select
          className="mt-1 rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-sm text-white dark:border-zinc-300 dark:bg-white dark:text-zinc-900"
          value={filters.country || ""}
          onChange={(e) => setFilters({ ...filters, country: e.target.value || null })}
        >
          <option value="">All</option>
          <option value="US">US</option>
          <option value="KR">KR</option>
        </select>
      </label>
      <label className="flex flex-col text-xs text-zinc-400 dark:text-zinc-600">
        Market
        <select
          className="mt-1 rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-sm text-white dark:border-zinc-300 dark:bg-white dark:text-zinc-900"
          value={filters.market || ""}
          onChange={(e) => setFilters({ ...filters, market: e.target.value || null })}
        >
          <option value="">All</option>
          {[...MARKETS.US, ...MARKETS.KR].map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col text-xs text-zinc-400 dark:text-zinc-600">
        Ticker contains
        <input
          className="mt-1 rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-sm text-white dark:border-zinc-300 dark:bg-white dark:text-zinc-900"
          value={filters.ticker || ""}
          onChange={(e) => setFilters({ ...filters, ticker: e.target.value || null })}
        />
      </label>
      <label className="flex flex-col text-xs text-zinc-400 dark:text-zinc-600">
        Sort
        <select
          className="mt-1 rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-sm text-white dark:border-zinc-300 dark:bg-white dark:text-zinc-900"
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value)}
        >
          <option value="latest">Latest</option>
          <option value="mostVoted">Most voted</option>
          <option value="deadlineSoon">Deadline soon</option>
          <option value="currentReturn">Current return</option>
          <option value="nearTarget">Nearest to target</option>
        </select>
      </label>
    </div>
  );
}
