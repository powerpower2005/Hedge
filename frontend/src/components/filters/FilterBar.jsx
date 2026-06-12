import { MARKETS } from "../../lib/constants";
import { useI18n } from "../../i18n/I18nContext.jsx";
import { ui } from "../../lib/themeClasses.js";

const filterLabel = `flex min-w-0 flex-col gap-1 ${ui.label}`;

export function FilterBar({ filters, setFilters, sortKey, setSortKey }) {
  const { t } = useI18n();
  return (
    <div className={`mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 ${ui.card} ${ui.cardPad}`}>
      <label className={filterLabel}>
        {t("filters.country")}
        <select
          className={ui.filterField}
          value={filters.country || ""}
          onChange={(e) => setFilters({ ...filters, country: e.target.value || null })}
        >
          <option value="">{t("common.all")}</option>
          <option value="US">US</option>
          <option value="KR">KR</option>
          <option value="HK">HK</option>
          <option value="JP">JP</option>
        </select>
      </label>
      <label className={filterLabel}>
        {t("filters.market")}
        <select
          className={ui.filterField}
          value={filters.market || ""}
          onChange={(e) => setFilters({ ...filters, market: e.target.value || null })}
        >
          <option value="">{t("common.all")}</option>
          {[...MARKETS.US, ...MARKETS.KR, ...MARKETS.HK, ...MARKETS.JP].map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </label>
      <label className={filterLabel}>
        {t("filters.tickerContains")}
        <input
          className={ui.filterField}
          value={filters.ticker || ""}
          onChange={(e) => setFilters({ ...filters, ticker: e.target.value || null })}
        />
      </label>
      <label className={filterLabel}>
        {t("filters.sort")}
        <select
          className={ui.filterField}
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
