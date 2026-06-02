import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { PickList } from "../components/pick/PickList.jsx";
import { StatBlock } from "../components/ui/StatBlock.jsx";
import { useAllMergedPicks } from "../hooks/useAllMergedPicks.js";
import { useI18n } from "../i18n/I18nContext.jsx";
import { formatReturn } from "../lib/formatters.js";
import { pickReturnForLeaderboard } from "../lib/userLeaderboard.js";
import { PageLoading } from "../components/ui/PageLoading.jsx";
import { dataLoadErrorMessage } from "../lib/userMessages.js";
import { ui } from "../lib/themeClasses.js";
import { type } from "../lib/typographyClasses.js";

export function UserPage() {
  const { username } = useParams();
  const { t } = useI18n();
  const { picks: allPicks, loading, error } = useAllMergedPicks();
  const picks = useMemo(() => allPicks.filter((p) => p.author === username), [allPicks, username]);

  const stats = useMemo(() => {
    const total = picks.length;
    const wins = picks.filter((p) => p.status?.current === "achieved").length;
    const avgTarget =
      total > 0 ? picks.reduce((s, p) => s + (p.target?.return_rate ?? 0), 0) / total : 0;
    const totalReturn = picks.reduce((s, p) => s + pickReturnForLeaderboard(p), 0);
    return { total, wins, avgTarget, totalReturn };
  }, [picks]);

  if (loading) return <PageLoading />;
  if (error) return <p className={`${ui.page} text-red-400 light:text-red-600`}>{dataLoadErrorMessage(error, t)}</p>;

  return (
    <article className={ui.page}>
      <nav className="text-sm">
        <Link to="/users" className={ui.link}>
          {t("nav.ranking")}
        </Link>
        <span className="mx-2 text-zinc-600 light:text-zinc-400" aria-hidden>
          /
        </span>
        <Link to="/" className={ui.link}>
          {t("common.home")}
        </Link>
      </nav>
      <h1 className={`mt-4 ${type.pageTitle}`}>{t("user.title", { name: username })}</h1>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatBlock label={t("user.totalPicks")} value={stats.total} />
        <StatBlock label={t("user.achieved")} value={stats.wins} />
        <StatBlock label={t("user.avgTarget")} value={formatReturn(stats.avgTarget)} />
        <StatBlock
          label={t("user.totalReturn")}
          value={formatReturn(stats.totalReturn)}
          hint={t("user.totalReturnHint")}
        />
      </div>
      <h2 className={`mt-8 ${ui.sectionTitle}`}>{t("user.allPicks")}</h2>
      <div className="mt-4">
        <PickList picks={picks} />
      </div>
    </article>
  );
}
