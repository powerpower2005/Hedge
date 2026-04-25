import { useState } from "react";
import { Link } from "react-router-dom";
import { useI18n } from "../../i18n/I18nContext.jsx";
import { formatPrice, formatReturn } from "../../lib/formatters.js";
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
        <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/30 light:border-zinc-200 light:bg-white">
          <div className="hidden grid-cols-[1.2fr_0.9fr_0.9fr_0.9fr_0.9fr_auto] gap-3 border-b border-zinc-800 px-3 py-2 text-xs text-zinc-500 sm:grid light:border-zinc-200 light:text-zinc-600">
            <span>{t("pickList.colTicker")}</span>
            <span>{t("pickList.colMarket")}</span>
            <span>{t("pickList.colTarget")}</span>
            <span>{t("pickList.colDeadline")}</span>
            <span>{t("pickList.colProgress")}</span>
            <span>{t("pickList.colStatus")}</span>
          </div>
          <ul className="divide-y divide-zinc-800 light:divide-zinc-200">
            {picks.map((p) => (
              <li
                key={p.id}
                className="grid gap-2 px-3 py-3 sm:grid-cols-[1.2fr_0.9fr_0.9fr_0.9fr_0.9fr_auto] sm:items-center sm:gap-3"
              >
                <div>
                  <Link
                    to={`/pick/${p.id}`}
                    className="font-semibold text-white hover:text-emerald-400 light:text-zinc-900 light:hover:text-emerald-700"
                  >
                    {p.ticker}
                  </Link>
                  <p className="text-xs text-zinc-500 light:text-zinc-600">
                    <Link className="hover:underline" to={`/user/${p.author}`}>
                      @{p.author}
                    </Link>
                    {p.instrument_name ? ` · ${p.instrument_name}` : ""}
                  </p>
                </div>
                <div className="text-sm">
                  <span className="mr-2 text-xs text-zinc-500 sm:hidden light:text-zinc-600">{t("pickList.colMarket")}</span>
                  {p.market}
                </div>
                <div className="text-sm">
                  <span className="mr-2 text-xs text-zinc-500 sm:hidden light:text-zinc-600">{t("pickList.colTarget")}</span>
                  {formatReturn(p.target?.return_rate)}
                </div>
                <div className="text-sm">
                  <span className="mr-2 text-xs text-zinc-500 sm:hidden light:text-zinc-600">{t("pickList.colDeadline")}</span>
                  {p.duration?.deadline || "-"}
                </div>
                <div className="text-sm">
                  <span className="mr-2 text-xs text-zinc-500 sm:hidden light:text-zinc-600">{t("pickList.colProgress")}</span>
                  {formatReturn(p.progress?.current?.return_rate)} · {formatPrice(p.country, p.entry?.price)}
                </div>
                <div className="justify-self-start sm:justify-self-end">
                  <StatusBadge status={p.status?.current} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
