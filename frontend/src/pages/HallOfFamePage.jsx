import { useMemo, useState } from "react";
import { FilterBar } from "../components/filters/FilterBar.jsx";
import { PickList } from "../components/pick/PickList.jsx";
import { applyFilters, SORTERS } from "../lib/filters.js";
import {
  achievedDateIso10,
  currentUtcYear,
  currentUtcYearMonth,
  formatYearMonthLabel,
  monthSelectOptions,
  yearSelectOptions,
} from "../lib/hallPeriod.js";
import { useHallArchivePicks } from "../hooks/useHallArchivePicks.js";
import { useI18n } from "../i18n/I18nContext.jsx";
import { dataLoadErrorMessage } from "../lib/userMessages.js";

const periodBtn = (active) =>
  `rounded-md px-3 py-2 text-sm font-medium ${
    active
      ? "bg-zinc-800 text-white light:bg-zinc-200 light:text-zinc-900"
      : "text-zinc-400 hover:text-white light:text-zinc-600 light:hover:text-zinc-900"
  }`;

export function HallOfFamePage() {
  const { t, locale } = useI18n();
  const { picks, loading, error } = useHallArchivePicks();
  const [filters, setFilters] = useState({});
  const [sortKey, setSortKey] = useState("latest");
  const [periodScope, setPeriodScope] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState(() => currentUtcYearMonth());
  const [selectedYear, setSelectedYear] = useState(() => currentUtcYear());

  const monthOptions = useMemo(
    () => monthSelectOptions(picks, selectedMonth),
    [picks, selectedMonth],
  );
  const yearOptions = useMemo(
    () => yearSelectOptions(picks, selectedYear),
    [picks, selectedYear],
  );

  const periodFiltered = useMemo(() => {
    if (periodScope === "all") return picks;
    return picks.filter((p) => {
      const ad = achievedDateIso10(p);
      if (!ad) return false;
      if (periodScope === "month") return ad.slice(0, 7) === selectedMonth;
      if (periodScope === "year") return ad.slice(0, 4) === selectedYear;
      return true;
    });
  }, [picks, periodScope, selectedMonth, selectedYear]);

  const visible = useMemo(() => {
    const f = applyFilters(periodFiltered, filters);
    const sorter = SORTERS[sortKey] || SORTERS.latest;
    return [...f].sort(sorter);
  }, [periodFiltered, filters, sortKey]);

  if (loading) return <p className="px-4 py-8 text-zinc-500 light:text-zinc-600">{t("common.loading")}</p>;
  if (error) return <p className="px-4 py-8 text-red-400 light:text-red-600">{dataLoadErrorMessage(error, t)}</p>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold text-white light:text-zinc-900">{t("hallOfFame.title")}</h1>
      <p className="mb-4 text-sm text-zinc-400 light:text-zinc-600">
        {t("hallOfFame.subtitle")}
      </p>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="mr-1 text-xs text-zinc-500 light:text-zinc-600">{t("hallOfFame.periodLabel")}</span>
        <button type="button" className={periodBtn(periodScope === "all")} onClick={() => setPeriodScope("all")}>
          {t("hallOfFame.periodAll")}
        </button>
        <button
          type="button"
          className={periodBtn(periodScope === "month")}
          onClick={() => setPeriodScope("month")}
        >
          {t("hallOfFame.periodMonth")}
        </button>
        <button
          type="button"
          className={periodBtn(periodScope === "year")}
          onClick={() => setPeriodScope("year")}
        >
          {t("hallOfFame.periodYear")}
        </button>
      </div>
      {periodScope === "month" && (
        <div className="mb-4">
          <label className="flex flex-col text-xs text-zinc-400 light:text-zinc-600 sm:inline-flex sm:items-center sm:gap-2">
            <span className="sm:shrink-0">{t("hallOfFame.selectMonth")}</span>
            <select
              className="mt-1 rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-sm text-white sm:mt-0 light:border-zinc-300 light:bg-white light:text-zinc-900"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              {monthOptions.map((ym) => (
                <option key={ym} value={ym}>
                  {formatYearMonthLabel(ym, locale)}
                </option>
              ))}
            </select>
          </label>
          <p className="mt-2 text-xs text-zinc-500 light:text-zinc-600">
            {t("hallOfFame.periodMonthHint")}
          </p>
        </div>
      )}
      {periodScope === "year" && (
        <div className="mb-4">
          <label className="flex flex-col text-xs text-zinc-400 light:text-zinc-600 sm:inline-flex sm:items-center sm:gap-2">
            <span className="sm:shrink-0">{t("hallOfFame.selectYear")}</span>
            <select
              className="mt-1 rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-sm text-white sm:mt-0 light:border-zinc-300 light:bg-white light:text-zinc-900"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </label>
          <p className="mt-2 text-xs text-zinc-500 light:text-zinc-600">
            {t("hallOfFame.periodYearHint")}
          </p>
        </div>
      )}
      <FilterBar
        filters={filters}
        setFilters={setFilters}
        sortKey={sortKey}
        setSortKey={setSortKey}
      />
      <PickList picks={visible} />
    </div>
  );
}
