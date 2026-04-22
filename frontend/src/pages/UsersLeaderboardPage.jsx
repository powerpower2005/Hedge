import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAllMergedPicks } from "../hooks/useAllMergedPicks.js";
import { useI18n } from "../i18n/I18nContext.jsx";
import { formatReturn } from "../lib/formatters.js";
import { ARCHIVE_PROBE_YEAR_MIN } from "../lib/publicPickFetch.js";
import { aggregateUserStats, sortUserStats } from "../lib/userLeaderboard.js";
import { dataLoadErrorMessage } from "../lib/userMessages.js";

const PAGE_SIZE = 20;

const VALID_USER_SORT = new Set(["winRate", "attempts", "wins"]);

export function UsersLeaderboardPage() {
  const { t } = useI18n();
  const { picks, loading, error } = useAllMergedPicks();
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(1);

  const rawSort = searchParams.get("sort");
  const sortKey = VALID_USER_SORT.has(rawSort) ? rawSort : "winRate";

  useEffect(() => {
    if (rawSort != null && !VALID_USER_SORT.has(rawSort)) {
      setSearchParams({}, { replace: true });
    }
  }, [rawSort, setSearchParams]);

  useEffect(() => {
    setPage(1);
  }, [sortKey]);

  const setSortKey = (next) => {
    if (next === "winRate") setSearchParams({}, { replace: true });
    else setSearchParams({ sort: next }, { replace: true });
  };

  const sorted = useMemo(() => {
    const rows = aggregateUserStats(picks);
    return sortUserStats(rows, sortKey);
  }, [picks, sortKey]);

  const totalPages = sorted.length === 0 ? 0 : Math.ceil(sorted.length / PAGE_SIZE);
  const safePage = totalPages === 0 ? 1 : Math.min(page, totalPages);
  const sliceStart = (safePage - 1) * PAGE_SIZE;
  const pageRows = sorted.slice(sliceStart, sliceStart + PAGE_SIZE);

  if (loading) return <p className="px-4 py-8 text-zinc-500 light:text-zinc-600">{t("common.loading")}</p>;
  if (error) return <p className="px-4 py-8 text-red-400 light:text-red-600">{dataLoadErrorMessage(error, t)}</p>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Link to="/" className="text-sm text-emerald-500 hover:underline">
        {t("common.home")}
      </Link>
      <h1 id="users-page-title" className="mt-4 text-2xl font-bold text-white light:text-zinc-900">
        {t("users.title")}
      </h1>
      <p className="mt-2 text-sm text-zinc-400 light:text-zinc-600">
        {t("users.subtitle", { minYear: String(ARCHIVE_PROBE_YEAR_MIN) })}
      </p>

      <div className="mt-6 flex flex-wrap items-end gap-4">
        <label className="flex flex-col text-xs text-zinc-400 light:text-zinc-600" htmlFor="users-sort">
          {t("users.sortLabel")}
          <select
            id="users-sort"
            className="mt-1 min-w-[12rem] rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-sm text-white light:border-zinc-300 light:bg-white light:text-zinc-900"
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value)}
          >
            <option value="winRate">{t("users.sortWinRate")}</option>
            <option value="attempts">{t("users.sortAttempts")}</option>
            <option value="wins">{t("users.sortWins")}</option>
          </select>
        </label>
        <p className="text-xs text-zinc-500 light:text-zinc-600">{t("users.winRateHint")}</p>
      </div>

      {sorted.length === 0 ? (
        <div role="status" className="mt-6 text-sm text-zinc-500 light:text-zinc-600">
          {t("users.empty")}
        </div>
      ) : (
        <>
          <div className="hidden md:mt-6 md:block">
            <div className="overflow-x-auto rounded-lg border border-zinc-800 light:border-zinc-200">
              <table
                className="w-full min-w-[36rem] border-collapse text-left text-sm"
                aria-labelledby="users-page-title"
              >
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900/40 light:border-zinc-200 light:bg-zinc-100">
                    <th scope="col" className="px-3 py-2 font-medium text-zinc-400 light:text-zinc-600">
                      {t("users.colRank")}
                    </th>
                    <th scope="col" className="px-3 py-2 font-medium text-zinc-400 light:text-zinc-600">
                      {t("users.colUser")}
                    </th>
                    <th scope="col" className="px-3 py-2 font-medium text-zinc-400 light:text-zinc-600">
                      {t("users.colAttempts")}
                    </th>
                    <th scope="col" className="px-3 py-2 font-medium text-zinc-400 light:text-zinc-600">
                      {t("users.colWins")}
                    </th>
                    <th scope="col" className="px-3 py-2 font-medium text-zinc-400 light:text-zinc-600">
                      {t("users.colWinRate")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((row, i) => {
                    const rank = sliceStart + i + 1;
                    return (
                      <tr
                        key={row.author}
                        className="border-b border-zinc-800/80 last:border-0 light:border-zinc-100 odd:bg-zinc-950/40 light:odd:bg-zinc-50/80"
                      >
                        <td className="px-3 py-2 tabular-nums text-zinc-500 light:text-zinc-600">{rank}</td>
                        <td className="px-3 py-2 font-medium">
                          <Link
                            className="text-emerald-500 hover:underline"
                            to={`/user/${encodeURIComponent(row.author)}`}
                          >
                            @{row.author}
                          </Link>
                        </td>
                        <td className="px-3 py-2 tabular-nums">{row.total}</td>
                        <td className="px-3 py-2 tabular-nums">{row.wins}</td>
                        <td className="px-3 py-2 tabular-nums">
                          {row.winRate == null ? "—" : formatReturn(row.winRate)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <ul
            className="mt-6 space-y-3 md:hidden"
            aria-label={t("users.mobileListLabel")}
          >
            {pageRows.map((row, i) => {
              const rank = sliceStart + i + 1;
              return (
                <li
                  key={row.author}
                  className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-4 light:border-zinc-200 light:bg-zinc-50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs tabular-nums text-zinc-500 light:text-zinc-600">
                      {t("users.cardRankLabel", { rank })}
                    </span>
                    <Link
                      className="font-medium text-emerald-500 hover:underline"
                      to={`/user/${encodeURIComponent(row.author)}`}
                    >
                      @{row.author}
                    </Link>
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <dt className="text-xs text-zinc-500 light:text-zinc-600">{t("users.colAttempts")}</dt>
                      <dd className="tabular-nums font-medium">{row.total}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-zinc-500 light:text-zinc-600">{t("users.colWins")}</dt>
                      <dd className="tabular-nums font-medium">{row.wins}</dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-xs text-zinc-500 light:text-zinc-600">{t("users.colWinRate")}</dt>
                      <dd className="tabular-nums font-medium">
                        {row.winRate == null ? "—" : formatReturn(row.winRate)}
                      </dd>
                    </div>
                  </dl>
                </li>
              );
            })}
          </ul>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 text-sm text-zinc-400 light:text-zinc-600">
            <p>
              {t("users.pageSummary", {
                from: sliceStart + 1,
                to: Math.min(sliceStart + PAGE_SIZE, sorted.length),
                total: sorted.length,
              })}
            </p>
            <nav className="flex flex-wrap items-center gap-2" aria-label={t("users.paginationNav")}>
              <button
                type="button"
                disabled={safePage <= 1}
                className="rounded border border-zinc-700 px-3 py-1 text-white enabled:hover:bg-zinc-800 disabled:opacity-40 light:border-zinc-300 light:text-zinc-900 light:enabled:hover:bg-zinc-100"
                aria-label={t("users.pagePrevAria", { page: safePage, total: totalPages })}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                {t("users.prev")}
              </button>
              <span className="tabular-nums">{safePage} / {totalPages}</span>
              <button
                type="button"
                disabled={safePage >= totalPages}
                className="rounded border border-zinc-700 px-3 py-1 text-white enabled:hover:bg-zinc-800 disabled:opacity-40 light:border-zinc-300 light:text-zinc-900 light:enabled:hover:bg-zinc-100"
                aria-label={t("users.pageNextAria", { page: safePage, total: totalPages })}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                {t("users.next")}
              </button>
            </nav>
          </div>
        </>
      )}
    </div>
  );
}
