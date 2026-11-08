import { useMemo, useState } from "react";
import { FilterBar } from "../components/filters/FilterBar.jsx";
import { PickList } from "../components/pick/PickList.jsx";
import { applyFilters, SORTERS } from "../lib/filters.js";
import { formatReturn } from "../lib/formatters.js";
import { IS_REPOSITORY_CONFIGURED, NEW_PICK_URL } from "../lib/constants.js";
import { useI18n } from "../i18n/I18nContext.jsx";
import { useAllMergedPicks } from "../hooks/useAllMergedPicks.js";
import { isEntryPending } from "../lib/pickEntry.js";
import { usePicks } from "../hooks/usePicks.js";
import { ui } from "../lib/themeClasses.js";
import { PageLoading } from "../components/ui/PageLoading.jsx";
import { dataLoadErrorMessage } from "../lib/userMessages.js";
import { ScheduleLink } from "../components/guide/ScheduleLink.jsx";
import { StatBlock } from "../components/ui/StatBlock.jsx";
import { MarketIndexRail, MarketIndexStrip, MarketSidebarReveal } from "../components/market/MarketMiniCharts.jsx";
import { useMarketSidebar } from "../hooks/useMarketSidebar.js";

export function ActivePage() {
  const { t } = useI18n();
  const { picks, loading, error } = usePicks("active");
  const { picks: allPicks, loading: allLoading } = useAllMergedPicks();
  const [filters, setFilters] = useState({});
  const [sortKey, setSortKey] = useState("latest");
  const { open: sidebarOpen, toggle: toggleSidebar } = useMarketSidebar();

  const activePicks = useMemo(() => picks.filter((p) => !isEntryPending(p)), [picks]);

  const visible = useMemo(() => {
    const f = applyFilters(activePicks, filters);
    const sorter = SORTERS[sortKey] || SORTERS.latest;
    return [...f].sort(sorter);
  }, [activePicks, filters, sortKey]);

  const stats = useMemo(() => {
    const total = allPicks.length;
    const activeCount = allPicks.filter((p) => p.status?.current === "active").length;
    const achievedCount = allPicks.filter((p) => p.status?.current === "achieved").length;
    const returns = allPicks
      .filter((p) => p.status?.current === "active")
      .map((p) => p.progress?.current?.return_rate)
      .filter((r) => r != null && !Number.isNaN(r));
    const avg = returns.length ? returns.reduce((a, b) => a + b, 0) / returns.length : null;
    return { total, activeCount, achievedCount, avg };
  }, [allPicks]);

  const count = visible.length;

  if (loading && !picks.length) {
    return (
      <div className={ui.page}>
        <PageLoading />
      </div>
    );
  }
  if (error) {
    return <p className={`${ui.page} text-red-400 light:text-red-600`}>{dataLoadErrorMessage(error, t)}</p>;
  }

  return (
    <div className={`${ui.page} dashboard`}>
      {!sidebarOpen ? <MarketSidebarReveal onOpen={toggleSidebar} /> : null}
      <div
        className={
          sidebarOpen
            ? "lg:grid lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start lg:gap-8 xl:grid-cols-[minmax(0,1fr)_20rem]"
            : undefined
        }
      >
        <article className="min-w-0">
          <section className="dashboard-hero" aria-labelledby="dashboard-hero-title">
            <div className="py-2">
              <h1 id="dashboard-hero-title" className="dashboard-title">{t("active.heroTitle")}</h1>
              <p className="mt-3 max-w-xl text-sm text-zinc-300 sm:text-base light:text-zinc-700">
                {t("guide.quickTagline")}
              </p>
              {IS_REPOSITORY_CONFIGURED ? (
                <a href={NEW_PICK_URL} target="_blank" rel="noopener noreferrer" className={`mt-5 ${ui.btnPrimary}`}>
                  {t("active.heroCta")} <span aria-hidden>↗</span>
                </a>
              ) : null}
            </div>
            <div className="dashboard-hero-art" aria-hidden="true" />
          </section>

          <div className="dashboard-overview">
            <p className="dashboard-schedule text-sm text-zinc-400 light:text-zinc-700">
              {t("schedule.dashboardTeaser")}{" "}
              <ScheduleLink className="font-semibold" />
            </p>
            {!allLoading ? (
              <section className="dashboard-stats" aria-label={t("active.statsLabel")}>
                <StatBlock label={t("active.statTotal")} value={stats.total} />
                <StatBlock label={t("active.statActive")} value={stats.activeCount} />
                <StatBlock label={t("active.statAchieved")} value={stats.achievedCount} />
                <StatBlock
                  label={t("active.statAvgReturn")}
                  value={stats.avg == null ? "—" : formatReturn(stats.avg)}
                  valueClass={stats.avg != null && stats.avg > 0 ? "!text-primary-400 light:!text-primary-700" : ""}
                />
              </section>
            ) : null}
          </div>

          <MarketIndexStrip className={sidebarOpen ? "lg:hidden" : ""} />

          <section id="pick-list" className="dashboard-picks scroll-mt-36" aria-labelledby="active-picks-title">
            <div className="dashboard-pick-controls">
              <h2 id="active-picks-title" className="dashboard-section-title">
                {t("active.title")}{" "}
                <span className="whitespace-nowrap text-sm font-medium tracking-normal text-zinc-400 light:text-zinc-600">
                  {t("active.subtitle", { count })}
                </span>
              </h2>
              <FilterBar filters={filters} setFilters={setFilters} sortKey={sortKey} setSortKey={setSortKey} />
            </div>
            <p className="mb-3 text-xs text-zinc-400 light:text-zinc-600">{t("active.nextStep")}</p>
            <PickList picks={visible} />
          </section>
        </article>

        {sidebarOpen ? <MarketIndexRail onCollapse={toggleSidebar} /> : null}
      </div>
    </div>
  );
}
