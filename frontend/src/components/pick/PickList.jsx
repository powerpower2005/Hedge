import { useState } from "react";
import { Link } from "react-router-dom";
import { useI18n } from "../../i18n/I18nContext.jsx";
import { isEntryPending } from "../../lib/pickEntry.js";
import { PickDeadline } from "./PickDeadline.jsx";
import { PickEntryPrice } from "./PickEntryPrice.jsx";
import { PickProgress } from "./PickProgress.jsx";
import { ReturnRate } from "./ReturnRate.jsx";
import { ui } from "../../lib/themeClasses.js";
import { type } from "../../lib/typographyClasses.js";
import { StatusBadge } from "./StatusBadge.jsx";
import { MarketBadge } from "./MarketBadge.jsx";
import { PickCard } from "./PickCard.jsx";
import { PickInstrumentHeading } from "./PickInstrumentHeading.jsx";
import { getPickDisplayReturnRate } from "../../lib/pickSignMismatch.js";


const VIEW_STORAGE_KEY = "hedge-pick-list-view";

function readInitialView() {
  try {
    return localStorage.getItem(VIEW_STORAGE_KEY) === "list" ? "list" : "card";
  } catch {
    return "card";
  }
}

function pickMetaLine(p, t) {
  const registered =
    typeof p.created_at === "string" && p.created_at.length >= 10
      ? p.created_at.slice(0, 10)
      : p.entry?.date || null;
  const achieved = p.status?.current === "achieved" ? p.achievement?.achieved_date : null;
  return { registered, achieved };
}

function PickListTickerCell({ p, t }) {
  const { registered, achieved } = pickMetaLine(p, t);
  return (
    <div className="min-w-0 max-w-[14rem] xl:max-w-none">
      <PickInstrumentHeading
        pick={p}
        variant="list"
        currentReturnRate={getPickDisplayReturnRate(p)}
      />
      <p className={`mt-1 truncate ${type.meta}`}>
        <Link className="font-medium hover:underline" to={`/user/${p.author}`}>
          @{p.author}
        </Link>
        {registered ? <span> · {registered}</span> : null}
        {achieved ? (
          <span className="font-semibold"> · {t("pickCard.achievedOn", { date: achieved })}</span>
        ) : null}
      </p>
    </div>
  );
}

function PickListMobileRow({ p, t }) {
  const pendingHint = isEntryPending(p) ? t("pick.pendingEntryHint") : undefined;
  return (
    <li>
      <article className="px-3 py-3">
        <header className="flex items-start justify-between gap-2">
          <PickListTickerCell p={p} t={t} />
          <StatusBadge status={p.status?.current} title={pendingHint} />
        </header>
        <dl className={`mt-3 ${ui.dlGrid}`}>
          <div className={ui.dlCell}>
            <dt className={ui.dlLabel}>{t("pickList.colMarket")}</dt>
            <dd className={`${ui.dlValueText} flex justify-end`}>
              <MarketBadge pick={p} />
            </dd>
          </div>
          <div className={ui.dlCell}>
            <dt className={ui.dlLabel}>{t("pickList.colTarget")}</dt>
            <dd className={ui.dlValue}>
              <ReturnRate rate={p.target?.return_rate} />
            </dd>
          </div>
          <div className={ui.dlCell}>
            <dt className={ui.dlLabel}>{t("pickList.colEntry")}</dt>
            <dd className={ui.dlValueText}>
              <PickEntryPrice pick={p} />
            </dd>
          </div>
          <div className={ui.dlCell}>
            <dt className={ui.dlLabel}>{t("pickList.colDeadline")}</dt>
            <dd className={ui.dlValueText}>
              <PickDeadline pick={p} />
            </dd>
          </div>
          <div className={`${ui.dlCell} col-span-2 sm:col-span-1`}>
            <dt className={ui.dlLabel}>{t("pickList.colProgress")}</dt>
            <dd className={`${ui.dlValueText} flex min-w-0 flex-col items-end`}>
              <PickProgress pick={p} />
            </dd>
          </div>
        </dl>
      </article>
    </li>
  );
}

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
      <p className="rounded-lg border-2 border-dashed border-zinc-600 p-8 text-center text-zinc-400 light:border-zinc-300 light:text-zinc-700">
        {t("pickList.empty")}
      </p>
    );
  }

  return (
    <section aria-label={t("pickList.sectionLabel")}>
      <fieldset className="mb-4 flex flex-wrap items-center gap-2.5 border-0 p-0 sm:gap-3">
        <legend className="sr-only">{t("pickList.viewLabel")}</legend>
        <span className="text-xs font-medium text-zinc-400 light:text-zinc-600">{t("pickList.viewLabel")}</span>
        <div className={ui.navGroup}>
          <button type="button" className={ui.navTab(view === "card", "compact")} onClick={() => setViewMode("card")}>
            {t("pickList.viewCards")}
          </button>
          <button type="button" className={ui.navTab(view === "list", "compact")} onClick={() => setViewMode("list")}>
            {t("pickList.viewList")}
          </button>
        </div>
      </fieldset>

      {view === "card" ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {picks.map((p) => (
            <PickCard key={p.id} pick={p} />
          ))}
        </div>
      ) : (
        <div className={ui.card}>
          <div className="hidden overflow-x-auto md:block">
            <table className={`${ui.table} min-w-[44rem] xl:min-w-0`}>
              <caption className="sr-only">{t("pickList.sectionLabel")}</caption>
              <thead>
                <tr className={ui.tableHeadRow}>
                  <th scope="col" className={`${ui.th} min-w-[9rem] xl:min-w-[10rem]`}>
                    {t("pickList.colTicker")}
                  </th>
                  <th scope="col" className={ui.th}>
                    {t("pickList.colMarket")}
                  </th>
                  <th scope="col" className={ui.thNum}>
                    {t("pickList.colTarget")}
                  </th>
                  <th scope="col" className={`${ui.thNum} min-w-[4.5rem]`}>
                    {t("pickList.colEntry")}
                  </th>
                  <th scope="col" className={`${ui.thNum} min-w-[5.5rem]`}>
                    {t("pickList.colDeadline")}
                  </th>
                  <th scope="col" className={`${ui.th} min-w-[7rem]`}>
                    {t("pickList.colProgress")}
                  </th>
                  <th scope="col" className={ui.thNum}>
                    {t("pickList.colStatus")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {picks.map((p) => {
                  const pendingHint = isEntryPending(p) ? t("pick.pendingEntryHint") : undefined;
                  return (
                    <tr key={p.id} className={`${ui.tableBodyRow} hover:bg-zinc-900/50 light:hover:bg-zinc-50/80`}>
                      <td className={ui.td}>
                        <PickListTickerCell p={p} t={t} />
                      </td>
                      <td className={ui.td}>
                        <MarketBadge pick={p} />
                      </td>
                      <td className={ui.tdNum}>
                        <ReturnRate rate={p.target?.return_rate} />
                      </td>
                      <td className={ui.tdNum}>
                        <PickEntryPrice pick={p} />
                      </td>
                      <td className={ui.tdNum}>
                        <PickDeadline pick={p} />
                      </td>
                      <td className={`${ui.td} min-w-[7rem] max-w-[11rem] xl:max-w-none`}>
                        <PickProgress pick={p} />
                      </td>
                      <td className={`${ui.tdNum} whitespace-nowrap`}>
                        <span className="inline-flex justify-end">
                          <StatusBadge status={p.status?.current} title={pendingHint} />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <ul className="divide-y divide-zinc-800/80 md:hidden light:divide-zinc-200">
            {picks.map((p) => (
              <PickListMobileRow key={p.id} p={p} t={t} />
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
