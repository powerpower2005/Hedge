import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { PickList } from "../components/pick/PickList.jsx";
import { useAllMergedPicks } from "../hooks/useAllMergedPicks.js";
import { useI18n } from "../i18n/I18nContext.jsx";
import { formatReturn } from "../lib/formatters.js";
import { dataLoadErrorMessage } from "../lib/userMessages.js";

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
    return { total, wins, avgTarget };
  }, [picks]);

  if (loading) return <p className="px-4 py-8 text-zinc-500 light:text-zinc-600">{t("common.loading")}</p>;
  if (error) return <p className="px-4 py-8 text-red-400 light:text-red-600">{dataLoadErrorMessage(error, t)}</p>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Link to="/" className="text-sm text-emerald-500 hover:underline">
        {t("common.home")}
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-white light:text-zinc-900">
        {t("user.title", { name: username })}
      </h1>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-zinc-800 p-4 light:border-zinc-200">
          <p className="text-xs text-zinc-500">{t("user.totalPicks")}</p>
          <p className="text-2xl font-semibold">{stats.total}</p>
        </div>
        <div className="rounded-lg border border-zinc-800 p-4 light:border-zinc-200">
          <p className="text-xs text-zinc-500">{t("user.achieved")}</p>
          <p className="text-2xl font-semibold">{stats.wins}</p>
        </div>
        <div className="rounded-lg border border-zinc-800 p-4 light:border-zinc-200">
          <p className="text-xs text-zinc-500">{t("user.avgTarget")}</p>
          <p className="text-2xl font-semibold">{formatReturn(stats.avgTarget)}</p>
        </div>
      </div>
      <h2 className="mt-8 text-lg font-semibold text-white light:text-zinc-900">{t("user.allPicks")}</h2>
      <div className="mt-4">
        <PickList picks={picks} />
      </div>
    </div>
  );
}
