import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { PickList } from "../components/pick/PickList.jsx";
import { DATA_URLS, IS_REPOSITORY_CONFIGURED } from "../lib/constants";
import { useI18n } from "../i18n/I18nContext.jsx";
import { formatReturn } from "../lib/formatters.js";
import { fetchJson } from "../hooks/usePicks.js";
import { dataLoadErrorMessage } from "../lib/userMessages.js";

export function UserPage() {
  const { username } = useParams();
  const { t } = useI18n();
  const [picks, setPicks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    (async () => {
      if (!IS_REPOSITORY_CONFIGURED) {
        if (!cancelled) setLoading(false);
        setError(new Error("Repository is not configured."));
        return;
      }
      try {
        const lists = await Promise.all([
          fetchJson(DATA_URLS.active),
          fetchJson(DATA_URLS.hallOfFame),
          fetchJson(DATA_URLS.expired),
        ]);
        const merged = [
          ...(lists[0].data?.picks ?? []),
          ...(lists[1].data?.picks ?? []),
          ...(lists[2].data?.picks ?? []),
        ].filter((p) => p.author === username);
        if (!cancelled) setPicks(merged);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e : new Error(String(e)));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [username]);

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
