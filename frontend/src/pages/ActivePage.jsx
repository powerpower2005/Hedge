import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FilterBar } from "../components/filters/FilterBar.jsx";
import { PickCard } from "../components/pick/PickCard.jsx";
import { PickList } from "../components/pick/PickList.jsx";
import { applyFilters, SORTERS } from "../lib/filters.js";
import { formatReturn } from "../lib/formatters.js";
import { IS_REPOSITORY_CONFIGURED, NEW_PICK_URL } from "../lib/constants.js";
import { useI18n } from "../i18n/I18nContext.jsx";
import { useAllMergedPicks } from "../hooks/useAllMergedPicks.js";
import { usePicks } from "../hooks/usePicks.js";
import { ui } from "../lib/themeClasses.js";
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
  const { picks, loading, error, meta } = usePicks("active");
  const { picks: allPicks, loading: allLoading } = useAllMergedPicks();
  const [filters, setFilters] = useState({});
  const [sortKey, setSortKey] = useState("latest");

  const visible = useMemo(() => {
    const f = applyFilters(picks, filters);
    const sorter = SORTERS[sortKey] || SORTERS.latest;
    return [...f].sort(sorter);
  }, [picks, filters, sortKey]);

  const hotPicks = useMemo(() => {
    const sorter = SORTERS.currentReturn || SORTERS.latest;
    return [...visible].sort(sorter).slice(0, 6);
  }, [visible]);

  const stats = useMemo(() => {
    const total = allPicks.length;
    const activeCount = allPicks.filter(
      (p) => p.status?.current === "active" || p.status?.current === "pending_entry",
    ).length;
    const achievedCount = allPicks.filter((p) => p.status?.current === "achieved").length;
    const returns = allPicks
      .filter((p) => p.status?.current === "active")
      .map((p) => p.progress?.current?.return_rate)
      .filter((r) => r != null && !Number.isNaN(r));
    const avg = returns.length ? returns.reduce((a, b) => a + b, 0) / returns.length : null;
    return { total, activeCount, achievedCount, avg };
  }, [allPicks]);

  const count = meta?.count ?? picks.length;

  if (loading && !picks.length) {
    return <p className={`${ui.page} text-zinc-400`}>{t("common.loading")}</p>;
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
        <div className="mt-6 flex flex-wrap gap-3">
          {IS_REPOSITORY_CONFIGURED ? (
            <a href={NEW_PICK_URL} className={ui.btnPrimary}>
              {t("active.heroCta")}
            </a>
          ) : null}
          <a href="#pick-list" className={ui.btnSecondary}>
            {t("active.viewAll")} →
          </a>
        </div>
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

      {hotPicks.length > 0 ? (
        <section className="mt-8" aria-labelledby="hot-picks-title">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 id="hot-picks-title" className={ui.sectionTitle}>
              {t("active.hotPicks")}
            </h2>
            <a href="#pick-list" className={`text-sm ${ui.link}`}>
              {t("active.viewAll")} →
            </a>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {hotPicks.map((p) => (
              <PickCard key={p.id} pick={p} />
            ))}
          </div>
        </section>
      ) : null}

      <section id="pick-list" className="mt-10 scroll-mt-24">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className={ui.sectionTitle}>
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
