import { useState } from "react";
import { Link } from "react-router-dom";
import { useI18n } from "../../i18n/I18nContext.jsx";
import { isEntryPending } from "../../lib/pickEntry.js";
import { PickDeadline } from "./PickDeadline.jsx";
import { PickEntryPrice } from "./PickEntryPrice.jsx";
import { PickProgress } from "./PickProgress.jsx";
import { ReturnRate } from "./ReturnRate.jsx";
import { StatusBadge } from "./StatusBadge.jsx";
import { PickCard } from "./PickCard.jsx";

const VIEW_STORAGE_KEY = "hedge-pick-list-view";

function readInitialView() {
  try {
    return localStorage.getItem(VIEW_STORAGE_KEY) === "list" ? "list" : "card";
  } catch {
    return "card";
  }
}

const viewBtnClass = (active) =>
  `rounded-md px-3 py-1.5 text-xs font-medium ${
    active
      ? "bg-zinc-800 text-white light:bg-zinc-200 light:text-zinc-900"
      : "text-zinc-400 hover:text-white light:text-zinc-600 light:hover:text-zinc-900"
  }`;

export function PickList({ picks }) {
  const { t } = useI18n();
  const [view, setView] = useState(readInitialView);

  const setViewMode = (next) => {
    setView(next);
    try {
      localStorage.setItem(VIEW_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  };

  if (!picks?.length) {
    return (
      <p className="rounded-lg border border-dashed border-zinc-700 p-8 text-center text-zinc-500 light:border-zinc-300 light:text-zinc-600">
        {t("pickList.empty")}
      </p>
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-end gap-2">
        <span className="text-xs text-zinc-500 light:text-zinc-600">{t("pickList.viewLabel")}</span>
        <button type="button" className={viewBtnClass(view === "card")} onClick={() => setViewMode("card")}>
          {t("pickList.viewCards")}
        </button>
        <button type="button" className={viewBtnClass(view === "list")} onClick={() => setViewMode("list")}>
          {t("pickList.viewList")}
        </button>
      </div>

      {view === "card" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {picks.map((p) => (
            <PickCard key={p.id} pick={p} />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-900/30 light:border-zinc-200 light:bg-white">
          <div className="hidden min-w-[52rem] grid-cols-[minmax(10rem,1.4fr)_3.5rem_4.5rem_5rem_6.5rem_7.5rem_4.5rem] gap-x-2 border-b border-zinc-800 px-2 py-1.5 text-[11px] font-medium uppercase tracking-wide text-zinc-500 sm:grid light:border-zinc-200 light:text-zinc-600">
            <span>{t("pickList.colTicker")}</span>
            <span>{t("pickList.colMarket")}</span>
            <span>{t("pickList.colTarget")}</span>
            <span>{t("pickList.colEntry")}</span>
            <span>{t("pickList.colDeadline")}</span>
            <span>{t("pickList.colProgress")}</span>
            <span className="text-right">{t("pickList.colStatus")}</span>
          </div>
          <ul className="min-w-[52rem] divide-y divide-zinc-800/80 light:divide-zinc-200">
            {picks.map((p) => {
              const registered =
                typeof p.created_at === "string" && p.created_at.length >= 10
                  ? p.created_at.slice(0, 10)
                  : p.entry?.date || null;
              const achieved = p.status?.current === "achieved" ? p.achievement?.achieved_date : null;
              return (
                <li
                  key={p.id}
                  className="grid gap-x-2 gap-y-1 px-2 py-1.5 text-xs sm:grid-cols-[minmax(10rem,1.4fr)_3.5rem_4.5rem_5rem_6.5rem_7.5rem_4.5rem] sm:items-center sm:gap-y-0 sm:py-2"
                >
                  <div className="min-w-0 sm:py-0">
                    <Link
                      to={`/pick/${p.id}`}
                      className="block truncate text-sm font-semibold leading-tight text-white hover:text-emerald-400 light:text-zinc-900 light:hover:text-emerald-700"
                    >
                      {p.instrument_name || p.ticker}
                    </Link>
                    <p className="truncate text-[11px] leading-tight text-zinc-500 light:text-zinc-600">
                      {p.instrument_name ? (
                        <span className="text-zinc-600 light:text-zinc-500">{p.ticker} · </span>
                      ) : null}
                      <Link className="hover:underline" to={`/user/${p.author}`}>
                        @{p.author}
                      </Link>
                      {registered ? <span> · {registered}</span> : null}
                      {achieved ? (
                        <span className="text-emerald-500 light:text-emerald-700"> · ✓ {achieved}</span>
                      ) : null}
                    </p>
                  </div>
                  <div className="tabular-nums text-zinc-300 light:text-zinc-700">
                    <span className="mr-1.5 text-[10px] text-zinc-500 sm:hidden">{t("pickList.colMarket")}</span>
                    {p.market}
                  </div>
                  <div>
                    <span className="mr-1.5 text-[10px] text-zinc-500 sm:hidden">{t("pickList.colTarget")}</span>
                    <ReturnRate rate={p.target?.return_rate} />
                  </div>
                  <div className="tabular-nums">
                    <span className="mr-1.5 text-[10px] text-zinc-500 sm:hidden">{t("pickList.colEntry")}</span>
                    <PickEntryPrice pick={p} />
                  </div>
                  <div className="tabular-nums leading-tight">
                    <span className="mr-1.5 text-[10px] text-zinc-500 sm:hidden">{t("pickList.colDeadline")}</span>
                    <PickDeadline pick={p} />
                  </div>
                  <div className="min-w-0 leading-tight">
                    <span className="mr-1.5 text-[10px] text-zinc-500 sm:hidden">{t("pickList.colProgress")}</span>
                    <PickProgress pick={p} />
                  </div>
                  <div className="justify-self-start sm:justify-self-end">
                    <StatusBadge
                      status={p.status?.current}
                      title={isEntryPending(p) ? t("pick.pendingEntryHint") : undefined}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
