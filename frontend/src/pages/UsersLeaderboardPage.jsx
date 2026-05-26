import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAllMergedPicks } from "../hooks/useAllMergedPicks.js";
import { useI18n } from "../i18n/I18nContext.jsx";
import { formatReturn, formatWinRate, returnRateColorClass } from "../lib/formatters.js";
import { type } from "../lib/typographyClasses.js";
import { ui } from "../lib/themeClasses.js";
import { aggregateUserStats, sortUserStats } from "../lib/userLeaderboard.js";
import { PageLoading } from "../components/ui/PageLoading.jsx";
import { dataLoadErrorMessage } from "../lib/userMessages.js";

const PAGE_SIZE = 20;

const VALID_USER_SORT = new Set(["winRate", "attempts", "wins"]);

function rankStickerText(t, rank) {
  if (rank === 1) return t("users.rankTitle1");
  if (rank === 2) return t("users.rankTitle2");
  if (rank === 3) return t("users.rankTitle3");
  return "";
}

function rankRuleText(t, sortKey) {
  if (sortKey === "attempts") return t("users.rankRuleAttempts");
  if (sortKey === "wins") return t("users.rankRuleWins");
  return t("users.rankRuleWinRate");
}

function TotalReturnHelp({ text, triggerAriaLabel }) {
  const [open, setOpen] = useState(false);

  return (
    <span className="group/total-return-help relative ml-1 inline-flex items-center align-middle">
      <button
        type="button"
        aria-label={triggerAriaLabel}
        aria-expanded={open}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-zinc-500 text-[10px] font-bold leading-none text-zinc-400 transition hover:border-emerald-500 hover:text-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/70 light:border-zinc-400 light:text-zinc-600 light:hover:border-emerald-700 light:hover:text-emerald-700"
        onClick={() => setOpen((v) => !v)}
        title={text}
      >
        ?
      </button>
      <span
        role="tooltip"
        className={`pointer-events-none absolute right-0 top-full z-20 mt-2 w-72 rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-[11px] font-normal leading-relaxed text-zinc-200 shadow-lg transition-opacity light:border-zinc-300 light:bg-white light:text-zinc-700 ${
          open ? "opacity-100" : "opacity-0 group-hover/total-return-help:opacity-100 group-focus-within/total-return-help:opacity-100"
        }`}
      >
        {text}
      </span>
    </span>
  );
}

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

  if (loading) return <PageLoading />;
  if (error) return <p className="px-4 py-8 text-red-400 light:text-red-600">{dataLoadErrorMessage(error, t)}</p>;

  return (
    <article className={ui.page}>
      <nav aria-label={t("common.home")} className="text-sm">
        <Link to="/" className={ui.link}>
          {t("common.home")}
        </Link>
      </nav>
      <header className="mt-4">
        <h1 id="users-page-title" className={type.pageTitle}>
          {t("users.title")}
        </h1>
        <p className={`mt-2 ${type.pageLead}`}>{t("users.subtitle")}</p>
      </header>

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
        <p className="max-w-xl text-xs text-zinc-500 light:text-zinc-600">
          {t("users.winRateHint")} {t("users.totalReturnHint")}
        </p>
        <p className="max-w-xl text-xs text-zinc-500 light:text-zinc-600">
          {t("users.totalReturnRankingNote")}
        </p>
        <p className="max-w-xl text-xs text-zinc-500 light:text-zinc-600">
          {t("users.rankRuleLabel")} {rankRuleText(t, sortKey)}
        </p>
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
                className="w-full min-w-[42rem] border-collapse text-left text-sm"
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
                    <th scope="col" className="px-3 py-2 font-medium text-zinc-400 light:text-zinc-600">
                      <span className="inline-flex items-center">
                        {t("users.colTotalReturn")}
                        <TotalReturnHelp
                          text={t("users.totalReturnFormula")}
                          triggerAriaLabel={t("users.totalReturnFormulaAria")}
                        />
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((row, i) => {
                    const rank = sliceStart + i + 1;
                    const titleSticker = rankStickerText(t, rank);
                    return (
                      <tr
                        key={row.author}
                        className="border-b border-zinc-800/80 last:border-0 light:border-zinc-100 odd:bg-zinc-950/40 light:odd:bg-zinc-50/80"
                      >
                        <td className="px-3 py-2 tabular-nums text-zinc-500 light:text-zinc-600">{rank}</td>
                        <td className="px-3 py-2 font-medium">
                          <span className="inline-flex items-center gap-2">
                            <Link
                              className="text-emerald-500 hover:underline"
                              to={`/user/${encodeURIComponent(row.author)}`}
                            >
                              @{row.author}
                            </Link>
                            {titleSticker ? (
                              <span className="rounded-full border border-amber-500 bg-amber-300 px-2.5 py-0.5 text-xs font-extrabold tracking-tight text-zinc-900 shadow-sm light:border-amber-500 light:bg-amber-300 light:text-zinc-900">
                                {titleSticker}
                              </span>
                            ) : null}
                          </span>
                        </td>
                        <td className="px-3 py-2 tabular-nums">{row.total}</td>
                        <td className="px-3 py-2 tabular-nums">{row.wins}</td>
                        <td className="px-3 py-2 tabular-nums text-zinc-200 light:text-zinc-800">
                          {row.winRate == null ? "—" : formatWinRate(row.winRate)}
                        </td>
                        <td className={`px-3 py-2 tabular-nums ${returnRateColorClass(row.totalReturn)}`}>
                          {formatReturn(row.totalReturn)}
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
              const titleSticker = rankStickerText(t, rank);
              return (
                <li
                  key={row.author}
                  className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-4 light:border-zinc-200 light:bg-zinc-50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs tabular-nums text-zinc-500 light:text-zinc-600">
                      {t("users.cardRankLabel", { rank })}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <Link
                        className="font-medium text-emerald-500 hover:underline"
                        to={`/user/${encodeURIComponent(row.author)}`}
                      >
                        @{row.author}
                      </Link>
                      {titleSticker ? (
                        <span className="rounded-full border border-amber-500 bg-amber-300 px-2.5 py-0.5 text-xs font-extrabold tracking-tight text-zinc-900 shadow-sm light:border-amber-500 light:bg-amber-300 light:text-zinc-900">
                          {titleSticker}
                        </span>
                      ) : null}
                    </span>
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
                    <div>
                      <dt className="text-xs text-zinc-500 light:text-zinc-600">{t("users.colWinRate")}</dt>
                      <dd className="tabular-nums font-medium text-zinc-200 light:text-zinc-800">
                        {row.winRate == null ? "—" : formatWinRate(row.winRate)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-zinc-400 light:text-zinc-700">
                        <span className="inline-flex items-center">
                          {t("users.colTotalReturn")}
                          <TotalReturnHelp
                            text={t("users.totalReturnFormula")}
                            triggerAriaLabel={t("users.totalReturnFormulaAria")}
                          />
                        </span>
                      </dt>
                      <dd className={`tabular-nums font-medium ${returnRateColorClass(row.totalReturn)}`}>
                        {formatReturn(row.totalReturn)}
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
    </article>
  );
}
