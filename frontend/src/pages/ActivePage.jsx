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

function StatCard({ label, value, valueClass = "" }) {
  return (
    <div className={ui.statCard}>
      <p className={ui.label}>{label}</p>
      <p className={`mt-2 text-2xl font-bold tabular-nums text-zinc-100 light:text-zinc-900 ${valueClass}`}>{value}</p>
    </div>
  );
}

export function ActivePage() {
  const { t } = useI18n();
  const { picks, loading, error } = usePicks("active");
  const { picks: allPicks, loading: allLoading } = useAllMergedPicks();
  const [filters, setFilters] = useState({});
  const [sortKey, setSortKey] = useState("latest");

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
    <article className={ui.page}>
      <section className={ui.hero} aria-labelledby="dashboard-hero-title">
        <h1 id="dashboard-hero-title" className="text-2xl font-bold tracking-tight text-zinc-100 sm:text-3xl light:text-zinc-900">
          {t("active.heroTitle")}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-300 light:text-zinc-700">
          {t("guide.quickTagline")}
        </p>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400 light:text-zinc-600">{t("active.nextStep")}</p>
        {IS_REPOSITORY_CONFIGURED ? (
          <div className="mt-6">
            <a href={NEW_PICK_URL} className={ui.btnPrimary}>
              {t("active.heroCta")}
            </a>
          </div>
        ) : null}
      </section>

      {!allLoading ? (
        <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label={t("active.statsLabel")}>
          <StatCard label={t("active.statTotal")} value={stats.total} />
          <StatCard label={t("active.statActive")} value={stats.activeCount} />
          <StatCard label={t("active.statAchieved")} value={stats.achievedCount} />
          <StatCard
            label={t("active.statAvgReturn")}
            value={stats.avg == null ? "—" : formatReturn(stats.avg)}
            valueClass={stats.avg != null && stats.avg > 0 ? "text-primary-400 light:text-primary-700" : ""}
          />
        </section>
      ) : null}

      <section id="pick-list" className="mt-8 scroll-mt-24" aria-labelledby="active-picks-title">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="active-picks-title" className={ui.sectionTitle}>
            {t("active.title")}{" "}
            <span className="text-base font-medium text-zinc-400 light:text-zinc-600">
              {t("active.subtitle", { count })}
            </span>
          </h2>
        </div>

        <FilterBar filters={filters} setFilters={setFilters} sortKey={sortKey} setSortKey={setSortKey} />

        <PickList picks={visible} />
      </section>
    </article>
  );
}
