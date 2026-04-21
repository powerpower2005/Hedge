import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { PickList } from "../components/pick/PickList.jsx";
import { DATA_URLS } from "../lib/constants";
import { formatReturn } from "../lib/formatters.js";
import { fetchJson } from "../hooks/usePicks.js";

export function UserPage() {
  const { username } = useParams();
  const [picks, setPicks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
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

  if (loading) return <p className="px-4 py-8 text-zinc-500">Loading…</p>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Link to="/" className="text-sm text-emerald-500 hover:underline">
        Home
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-white dark:text-zinc-900">@{username}</h1>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-zinc-800 p-4 dark:border-zinc-200">
          <p className="text-xs text-zinc-500">Total picks</p>
          <p className="text-2xl font-semibold">{stats.total}</p>
        </div>
        <div className="rounded-lg border border-zinc-800 p-4 dark:border-zinc-200">
          <p className="text-xs text-zinc-500">Achieved</p>
          <p className="text-2xl font-semibold">{stats.wins}</p>
        </div>
        <div className="rounded-lg border border-zinc-800 p-4 dark:border-zinc-200">
          <p className="text-xs text-zinc-500">Avg target return</p>
          <p className="text-2xl font-semibold">{formatReturn(stats.avgTarget)}</p>
        </div>
      </div>
      <h2 className="mt-8 text-lg font-semibold text-white dark:text-zinc-900">All picks</h2>
      <div className="mt-4">
        <PickList picks={picks} />
      </div>
    </div>
  );
}
