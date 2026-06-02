import { MARKETS } from "../../lib/constants";
import { useI18n } from "../../i18n/I18nContext.jsx";
import { ui } from "../../lib/themeClasses.js";

export function FilterBar({ filters, setFilters, sortKey, setSortKey }) {
  const { t } = useI18n();
  return (
    <div className={`mb-6 flex flex-wrap items-end gap-4 ${ui.card} ${ui.cardPad}`}>
      <label className={`flex flex-col ${ui.label}`}>
        {t("filters.country")}
        <select
          className={ui.field}
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
      <label className={`flex flex-col ${ui.label}`}>
        {t("filters.market")}
        <select
          className={ui.field}
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
      <label className={`flex flex-col ${ui.label}`}>
        {t("filters.tickerContains")}
        <input
          className={ui.field}
          value={filters.ticker || ""}
          onChange={(e) => setFilters({ ...filters, ticker: e.target.value || null })}
        />
      </label>
      <label className={`flex flex-col ${ui.label}`}>
        {t("filters.sort")}
        <select
          className={ui.field}
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
