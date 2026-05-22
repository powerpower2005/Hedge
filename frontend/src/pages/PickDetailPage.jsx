import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { StatusBadge } from "../components/pick/StatusBadge.jsx";
import { useDataCacheRevision } from "../context/DataCacheContext.jsx";
import { IS_REPOSITORY_CONFIGURED, pickIssueUrl } from "../lib/constants.js";
import { useI18n } from "../i18n/I18nContext.jsx";
import { PickDeadline } from "../components/pick/PickDeadline.jsx";
import { PickEntryPrice } from "../components/pick/PickEntryPrice.jsx";
import { PickProgress } from "../components/pick/PickProgress.jsx";
import { isEntryPending } from "../lib/pickEntry.js";
import { ReturnRate } from "../components/pick/ReturnRate.jsx";
import { formatPrice, formatReturn } from "../lib/formatters.js";
import { googleFinanceQuoteUrl } from "../lib/googleFinanceUrl.js";
import { loadAllPublicPicksCached } from "../lib/publicPickFetch.js";
import { type } from "../lib/typographyClasses.js";
import { pickDetailErrorMessage } from "../lib/userMessages.js";

export function PickDetailPage() {
  const { id } = useParams();
  const { t } = useI18n();
  const dataRevision = useDataCacheRevision();
  const [pick, setPick] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const want = Number(id);
    setPick(null);
    setErr(null);
    (async () => {
      if (!IS_REPOSITORY_CONFIGURED) {
        if (!cancelled) setErr({ code: "loadfailed" });
        return;
      }
      try {
        const merged = await loadAllPublicPicksCached();
        const found = merged.find((p) => p.id === want);
        if (!cancelled) {
          if (found) setPick(found);
          else setErr({ code: "notfound" });
        }
      } catch (e) {
        if (!cancelled) setErr({ code: "loadfailed", dev: String(e?.message ?? e) });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, dataRevision]);

  if (err && !pick) return <p className="px-4 py-8 text-red-400 light:text-red-600">{pickDetailErrorMessage(err, t)}</p>;
  if (!pick) return <p className="px-4 py-8 text-zinc-500 light:text-zinc-600">{t("common.loading")}</p>;

  const issueUrl = pickIssueUrl(pick.issue_number);
  const financeUrl = googleFinanceQuoteUrl(pick);
  const registeredOn =
    typeof pick.created_at === "string" && pick.created_at.length >= 10
      ? pick.created_at.slice(0, 10)
      : pick.entry?.date || null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link to="/" className={`mt-2 inline-block hover:underline ${type.meta}`}>
        {t("common.backToList")}
      </Link>
      <header className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 space-y-2">
          <h1 className={type.detailTitle}>{pick.instrument_name || pick.ticker}</h1>
          {pick.instrument_name ? (
            <p className={type.meta}>{pick.ticker}</p>
          ) : financeUrl ? (
            <p className={type.meta}>
              <a href={financeUrl} target="_blank" rel="noopener noreferrer" className="font-medium hover:underline">
                {t("pickCard.nameOnGoogleFinance")}
              </a>
            </p>
          ) : null}
          <p className={`pt-1 ${type.meta}`}>
            <Link className="font-medium hover:underline" to={`/user/${pick.author}`}>
              @{pick.author}
            </Link>
            {" · "}
            {pick.market}
            {" · "}
            {t("pickDetail.refLine", { n: pick.issue_number })}
          </p>
        </div>
        <StatusBadge
          status={pick.status?.current}
          title={isEntryPending(pick) ? t("pick.pendingEntryHint") : undefined}
        />
      </header>
      {isEntryPending(pick) ? (
        <p className={`mt-3 ${type.metaSm} font-medium`}>{t("pick.pendingEntryHint")}</p>
      ) : null}
      {pick.author_note ? (
        <details className="mt-6 rounded-lg border border-zinc-800 bg-zinc-900/20 light:border-zinc-200 light:bg-zinc-50">
          <summary className={`cursor-pointer select-none px-4 py-3 ${type.stepTitle}`}>
            {t("pickDetail.authorNoteSummary")}
          </summary>
          <div className="border-t border-zinc-800 px-4 py-3 light:border-zinc-200">
            <p className={`whitespace-pre-wrap break-words ${type.body}`}>{pick.author_note}</p>
            <p className={`mt-3 ${type.metaSm}`}>{t("pickDetail.authorNoteDisclaimer")}</p>
          </div>
        </details>
      ) : null}
      <dl className="mt-8 divide-y divide-zinc-800 light:divide-zinc-200">
        {registeredOn ? (
          <div className="flex items-baseline justify-between gap-4 py-3">
            <dt className={type.fieldLabel}>{t("pickDetail.registeredOn")}</dt>
            <dd className={type.fieldValue}>{registeredOn}</dd>
          </div>
        ) : null}
        <div className="flex items-baseline justify-between gap-4 py-3">
          <dt className={type.fieldLabel}>{t("pickDetail.entry")}</dt>
          <dd className={type.fieldValue}>
            <PickEntryPrice pick={pick} />
          </dd>
        </div>
        {pick.entry?.close_session_date ? (
          <div className="flex items-baseline justify-between gap-4 py-3">
            <dt className={type.fieldLabel}>{t("pickDetail.entryCloseSessionDate")}</dt>
            <dd className={type.fieldValue}>{pick.entry.close_session_date}</dd>
          </div>
        ) : null}
        <div className="flex items-baseline justify-between gap-4 py-3">
          <dt className={type.fieldLabel}>{t("pickDetail.targetReturn")}</dt>
          <dd className={type.fieldValue}>
            <ReturnRate rate={pick.target?.return_rate} />
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-4 py-3">
          <dt className={type.fieldLabel}>{t("pickDetail.targetPrice")}</dt>
          <dd className={type.fieldValue}>
            {isEntryPending(pick) ? (
              <span className="font-normal text-zinc-500 light:text-zinc-600">{t("pick.pendingTargetPrice")}</span>
            ) : (
              formatPrice(pick.country, pick.target?.price)
            )}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-4 py-3">
          <dt className={type.fieldLabel}>{t("pickDetail.deadline")}</dt>
          <dd className={type.fieldValue}>
            <PickDeadline pick={pick} />
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-4 py-3">
          <dt className={type.fieldLabel}>{t("pickDetail.currentReturn")}</dt>
          <dd className={type.fieldValue}>
            <PickProgress pick={pick} />
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-4 py-3">
          <dt className={type.fieldLabel}>{t("pickDetail.votes")}</dt>
          <dd className={type.fieldValue}>
            {t("pickDetail.votesTally", { likes: pick.votes?.likes ?? 0, dislikes: pick.votes?.dislikes ?? 0 })}
          </dd>
        </div>
      </dl>
      {issueUrl ? (
        <div className="mt-8 rounded-lg border border-zinc-800 bg-zinc-900/30 p-5 light:border-zinc-200 light:bg-zinc-50">
          <p className={type.stepTitle}>{t("pickDetail.voteCtaTitle")}</p>
          <p className={`mt-2 ${type.stepBody}`}>{t("pickDetail.voteCtaBody")}</p>
          <a
            href={issueUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`mt-4 inline-block font-semibold hover:underline ${type.body}`}
          >
            {t("pickDetail.openIssue", { n: pick.issue_number })}
          </a>
        </div>
      ) : null}
      {pick.achievement && (
        <div className="mt-8 rounded-lg border border-zinc-700 bg-zinc-900/40 p-5 light:border-zinc-300 light:bg-zinc-50">
          <p className={type.sectionLabel}>{t("pickDetail.achieved")}</p>
          <p className={`mt-3 ${type.body}`}>
            {t("pickDetail.achievedMeta", {
              date: pick.achievement.achieved_date,
              days: pick.achievement.days_taken,
              final: formatReturn(pick.achievement.final_return_rate),
            })}
          </p>
        </div>
      )}
    </div>
  );
}
