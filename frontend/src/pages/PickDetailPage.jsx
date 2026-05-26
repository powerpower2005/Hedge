import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ProgressBar } from "../components/ui/ProgressBar.jsx";
import { StatusBadge } from "../components/pick/StatusBadge.jsx";
import { useDataCacheRevision } from "../context/DataCacheContext.jsx";
import { IS_REPOSITORY_CONFIGURED, pickIssueUrl } from "../lib/constants.js";
import { useI18n } from "../i18n/I18nContext.jsx";
import { PickDeadline } from "../components/pick/PickDeadline.jsx";
import { PickEntryPrice } from "../components/pick/PickEntryPrice.jsx";
import { isEntryPending } from "../lib/pickEntry.js";
import { targetAchievementPercent } from "../lib/pickProgressPct.js";
import { ReturnRate } from "../components/pick/ReturnRate.jsx";
import { PickPriceDisplay } from "../components/pick/PickPriceDisplay.jsx";
import { formatPrice, formatReturn } from "../lib/formatters.js";
import { getExpirySnapshot, isExpiredPick } from "../lib/pickPrices.js";
import { googleFinanceQuoteUrl } from "../lib/googleFinanceUrl.js";
import { loadAllPublicPicksCached } from "../lib/publicPickFetch.js";
import { ui } from "../lib/themeClasses.js";
import { type } from "../lib/typographyClasses.js";
import { pickDetailErrorMessage } from "../lib/userMessages.js";

function MetricBox({ label, children }) {
  return (
    <div className="rounded-xl bg-zinc-800/40 p-3 light:bg-zinc-50">
      <p className={ui.label}>{label}</p>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

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

  if (err && !pick) {
    return <p className={`${ui.page} text-red-400 light:text-red-600`}>{pickDetailErrorMessage(err, t)}</p>;
  }
  if (!pick) return <p className={`${ui.page} text-zinc-400`}>{t("common.loading")}</p>;

  const issueUrl = pickIssueUrl(pick.issue_number);
  const financeUrl = googleFinanceQuoteUrl(pick);
  const registeredOn =
    typeof pick.created_at === "string" && pick.created_at.length >= 10
      ? pick.created_at.slice(0, 10)
      : pick.entry?.date || null;
  const progressPct = targetAchievementPercent(pick);
  const expired = isExpiredPick(pick);
  const expirySnap = expired ? getExpirySnapshot(pick) : null;
  const displayReturn =
    expired && expirySnap?.return_rate != null
      ? expirySnap.return_rate
      : pick.progress?.current?.return_rate;
  const countryLabel = pick.country === "KR" ? t("pickDetail.countryKr") : t("pickDetail.countryUs");
  const currencyLabel = pick.country === "KR" ? "KRW" : "USD";

  return (
    <article className={ui.page}>
      <nav className="mb-4">
        <Link to="/" className={`inline-flex items-center gap-1 text-sm ${ui.link}`}>
          <span aria-hidden>←</span> {t("common.backShort")}
        </Link>
      </nav>

      <section className={`${ui.card} ${ui.cardPad}`}>
        <header>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className={ui.ticker}>{pick.ticker}</h1>
              <span className={ui.badgeMarket}>{pick.market}</span>
              <StatusBadge
                status={pick.status?.current}
                title={isEntryPending(pick) ? t("pick.pendingEntryHint") : undefined}
              />
            </div>
          </div>
          <p className="mt-2 text-lg font-bold text-zinc-100 light:text-zinc-900">
            {pick.instrument_name || pick.ticker}
          </p>
          <p className={`mt-1 ${type.meta}`}>
            <Link className={ui.link} to={`/user/${pick.author}`}>
              @{pick.author}
            </Link>
            {registeredOn ? <span> · {registeredOn}</span> : null}
            <span className="text-zinc-500"> · {t("pickDetail.refLine", { n: pick.issue_number })}</span>
          </p>
        </header>

        {isEntryPending(pick) ? (
          <p className={`mt-4 rounded-xl border border-sky-800/50 bg-sky-950/30 px-3 py-2 text-sm text-sky-200 light:border-sky-200 light:bg-sky-50 light:text-sky-900`}>
            {t("pick.pendingEntryHint")}
          </p>
        ) : null}

        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <MetricBox label={t("pickDetail.targetReturn")}>
            <ReturnRate rate={pick.target?.return_rate} className={ui.valueLg} />
          </MetricBox>
          <MetricBox label={t("pickDetail.currentReturn")}>
            {isEntryPending(pick) ? (
              <span className={type.meta}>{t("pick.pendingProgress")}</span>
            ) : (
              <ReturnRate rate={displayReturn} className={ui.valueLg} />
            )}
          </MetricBox>
          <MetricBox label={t("pickDetail.entry")}>
            <span className={ui.valueLg}>
              <PickEntryPrice pick={pick} />
            </span>
          </MetricBox>
          <div
            className={`rounded-xl bg-zinc-800/40 p-3 light:bg-zinc-50 ${
              expired && expirySnap ? "col-span-2 lg:col-span-1" : ""
            }`}
          >
            <PickPriceDisplay pick={pick} size="lg" />
          </div>
        </div>

        <ProgressBar percent={progressPct} />
      </section>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <section className={`${ui.card} ${ui.cardPad}`}>
          <h2 className={`${ui.label} mb-2`}>{t("pickDetail.deadline")}</h2>
          <p className={ui.valueLg}>
            <PickDeadline pick={pick} />
          </p>
        </section>
        <section className={`${ui.card} ${ui.cardPad}`}>
          <h2 className={`${ui.label} mb-2`}>{t("pickDetail.exchangeInfo")}</h2>
          <p className={ui.valueLg}>{pick.market}</p>
          <p className={`mt-1 ${type.meta}`}>
            {countryLabel} · {currencyLabel}
          </p>
          {financeUrl ? (
            <a
              href={financeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`mt-2 inline-block text-sm ${ui.link}`}
            >
              {t("pickCard.nameOnGoogleFinance")}
            </a>
          ) : null}
        </section>
      </div>

      {pick.author_note ? (
        <section className={`mt-4 ${ui.card} ${ui.cardPad}`}>
          <h2 className={ui.sectionTitle}>{t("pickDetail.pickReason")}</h2>
          <p className={`mt-3 whitespace-pre-wrap break-words ${type.body}`}>{pick.author_note}</p>
          <p className={`mt-3 ${type.metaSm}`}>{t("pickDetail.authorNoteDisclaimer")}</p>
        </section>
      ) : null}

      {registeredOn ? (
        <p className={`mt-4 ${type.meta}`}>
          {t("pickDetail.registeredOn")}: {registeredOn}
        </p>
      ) : null}

      {!isEntryPending(pick) && pick.target?.price != null ? (
        <p className={`mt-2 ${type.meta}`}>
          {t("pickDetail.targetPrice")}: {formatPrice(pick.country, pick.target?.price)}
        </p>
      ) : null}

      {pick.entry?.close_session_date ? (
        <p className={`mt-1 ${type.meta}`}>
          {t("pickDetail.entryCloseSessionDate")}: {pick.entry.close_session_date}
        </p>
      ) : null}

      {issueUrl ? (
        <section className={`mt-4 ${ui.card} ${ui.cardPad}`} aria-labelledby="vote-section-title">
          <h2 id="vote-section-title" className={ui.sectionTitle}>
            {t("pickDetail.votes")}
          </h2>
          <p className={`mt-2 ${type.meta}`}>{t("pickDetail.voteCtaBody")}</p>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <a
              href={issueUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`${ui.btnSecondary} justify-center py-3`}
            >
              👍 {t("pickDetail.voteAgree", { n: pick.votes?.likes ?? 0 })}
            </a>
            <a
              href={issueUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`${ui.btnSecondary} justify-center py-3`}
            >
              👎 {t("pickDetail.voteDisagree", { n: pick.votes?.dislikes ?? 0 })}
            </a>
          </div>
          <a
            href={issueUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`mt-4 inline-block text-sm ${ui.link}`}
          >
            {t("pickDetail.openIssue", { n: pick.issue_number })}
          </a>
        </section>
      ) : null}

      {pick.achievement ? (
        <section className={`mt-4 ${ui.card} ${ui.cardPad}`}>
          <p className={type.sectionLabel}>{t("pickDetail.achieved")}</p>
          <p className={`mt-3 ${type.body}`}>
            {t("pickDetail.achievedMeta", {
              date: pick.achievement.achieved_date,
              days: pick.achievement.days_taken,
              final: formatReturn(pick.achievement.final_return_rate),
            })}
          </p>
        </section>
      ) : null}
    </article>
  );
}
