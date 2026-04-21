import { MARKETS } from "../../lib/constants";
import { useI18n } from "../../i18n/I18nContext.jsx";

export function FilterBar({ filters, setFilters, sortKey, setSortKey }) {
  const { t } = useI18n();
  return (
    <div className="mb-6 flex flex-wrap items-end gap-4 rounded-lg border border-zinc-800 bg-zinc-900/30 p-4 light:border-zinc-200 light:bg-zinc-50">
      <label className="flex flex-col text-xs text-zinc-400 light:text-zinc-600">
        {t("filters.country")}
        <select
          className="mt-1 rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-sm text-white light:border-zinc-300 light:bg-white light:text-zinc-900"
          value={filters.country || ""}
          onChange={(e) => setFilters({ ...filters, country: e.target.value || null })}
        >
          <option value="">{t("common.all")}</option>
          <option value="US">US</option>
          <option value="KR">KR</option>
        </select>
      </label>
      <label className="flex flex-col text-xs text-zinc-400 light:text-zinc-600">
        {t("filters.market")}
        <select
          className="mt-1 rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-sm text-white light:border-zinc-300 light:bg-white light:text-zinc-900"
          value={filters.market || ""}
          onChange={(e) => setFilters({ ...filters, market: e.target.value || null })}
        >
          <option value="">{t("common.all")}</option>
          {[...MARKETS.US, ...MARKETS.KR].map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col text-xs text-zinc-400 light:text-zinc-600">
        {t("filters.tickerContains")}
        <input
          className="mt-1 rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-sm text-white light:border-zinc-300 light:bg-white light:text-zinc-900"
          value={filters.ticker || ""}
          onChange={(e) => setFilters({ ...filters, ticker: e.target.value || null })}
        />
      </label>
      <label className="flex flex-col text-xs text-zinc-400 light:text-zinc-600">
        {t("filters.sort")}
        <select
          className="mt-1 rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-sm text-white light:border-zinc-300 light:bg-white light:text-zinc-900"
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value)}
        >
          <option value="latest">{t("filters.sortLatest")}</option>
          <option value="mostVoted">{t("filters.sortMostVoted")}</option>
          <option value="deadlineSoon">{t("filters.sortDeadlineSoon")}</option>
          <option value="currentReturn">{t("filters.sortCurrentReturn")}</option>
          <option value="nearTarget">{t("filters.sortNearTarget")}</option>
        </select>
      </label>
    </div>
  );
}
