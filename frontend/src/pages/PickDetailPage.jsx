import { Link } from "react-router-dom";
import { PageLoading } from "../components/ui/PageLoading.jsx";
import { ProgressBar } from "../components/ui/ProgressBar.jsx";
import { StatusBadge } from "../components/pick/StatusBadge.jsx";
import { usePickById } from "../hooks/usePickById.js";
import { pickIssueUrl } from "../lib/constants.js";
import { useI18n } from "../i18n/I18nContext.jsx";
import { PickDeadline } from "../components/pick/PickDeadline.jsx";
import { PickEntryPrice } from "../components/pick/PickEntryPrice.jsx";
import { isEntryPending } from "../lib/pickEntry.js";
import { targetAchievementPercent } from "../lib/pickProgressPct.js";
import { ReturnRate } from "../components/pick/ReturnRate.jsx";
import { PickPriceDisplay } from "../components/pick/PickPriceDisplay.jsx";
import { formatPrice, formatReturn } from "../lib/formatters.js";
import { MarketBadge } from "../components/pick/MarketBadge.jsx";
import { PickInstrumentHeading } from "../components/pick/PickInstrumentHeading.jsx";
import { getPickDisplayReturnRate } from "../lib/pickSignMismatch.js";
import { googleFinanceQuoteUrl } from "../lib/googleFinanceUrl.js";
import { pickCountryLabel, pickCurrencyLabel } from "../lib/pickCountryMeta.js";
import { ui } from "../lib/themeClasses.js";
import { type } from "../lib/typographyClasses.js";
import { pickDetailErrorMessage } from "../lib/userMessages.js";
import { MetricBlock } from "../components/ui/MetricBlock.jsx";
import { PickDailyChart } from "../components/pick/PickDailyChart.jsx";

export function PickDetailPage() {
  const { t } = useI18n();
  const { pick, err, pickId } = usePickById();

  if (err && !pick) {
    return <p className={`${ui.page} text-red-400 light:text-red-600`}>{pickDetailErrorMessage(err, t)}</p>;
  }
  if (!pick) {
    return (
      <div className={ui.page}>
        <PageLoading />
      </div>
    );
  }

  const issueUrl = pickIssueUrl(pick.issue_number);
  const financeUrl = googleFinanceQuoteUrl(pick);
  const registeredOn =
    typeof pick.created_at === "string" && pick.created_at.length >= 10
      ? pick.created_at.slice(0, 10)
      : pick.entry?.date || null;
  const progressPct = targetAchievementPercent(pick);
  const displayReturn = getPickDisplayReturnRate(pick);
  const countryLabel = pickCountryLabel(pick.country, t);
  const currencyLabel = pickCurrencyLabel(pick.country);

  return (
    <article className={`${ui.page} pick-detail`}>
      <nav className="mb-4">
        <Link to="/" className={`inline-flex items-center gap-1 text-sm ${ui.link}`}>
          <span aria-hidden>←</span> {t("common.backShort")}
        </Link>
      </nav>

      <section>
        <header>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <PickInstrumentHeading
              pick={pick}
              variant="detail"
              currentReturnRate={displayReturn}
              className="min-w-0 flex-1"
            />
            <StatusBadge
              status={pick.status?.current}
              title={isEntryPending(pick) ? t("pick.pendingEntryHint") : undefined}
            />
          </div>
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

        <div className="detail-metrics">
          <MetricBlock label={t("pickDetail.targetReturn")}>
            <ReturnRate rate={pick.target?.return_rate} className="detail-number" />
          </MetricBlock>
          <MetricBlock label={t("pickDetail.currentReturn")}>
            {isEntryPending(pick) ? (
              <span className={type.meta}>{t("pick.pendingProgress")}</span>
            ) : (
              <ReturnRate rate={displayReturn} className="detail-number" />
            )}
          </MetricBlock>
          <MetricBlock label={t("pickDetail.entry")}>
            <span className="detail-number">
              <PickEntryPrice pick={pick} />
            </span>
          </MetricBlock>
          <div className={ui.metricBlock}>
            <PickPriceDisplay pick={pick} size="lg" />
          </div>
        </div>

        <ProgressBar percent={progressPct} />
      </section>

      <PickDailyChart pick={pick} mode="pick" historyHref={`/pick/${pickId}/history`} />

      <div className="detail-band mt-5 grid gap-x-8 sm:grid-cols-2">
        <section className="py-4">
          <h2 className={ui.label}>{t("pickDetail.deadline")}</h2>
          <p className={`${ui.valueLg} mt-2`}>
            <PickDeadline pick={pick} />
          </p>
        </section>
        <section className="py-4">
          <h2 className={ui.label}>{t("pickDetail.exchangeInfo")}</h2>
          <p className="mt-2">
            <MarketBadge pick={pick} className="text-sm" />
          </p>
          <p className={`mt-1.5 ${type.meta}`}>
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
        <section className="detail-rule mt-4 py-4">
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
        <section className="detail-rule mt-5 py-4" aria-labelledby="vote-section-title">
          <h2 id="vote-section-title" className={ui.sectionTitle}>
            {t("pickDetail.votes")}
          </h2>
          <p className={`mt-2 ${type.meta}`}>{t("pickDetail.voteCtaBody")}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href={issueUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`${ui.btnSecondary} light:!border-primary-700/20 light:!bg-[#dbedaa] light:!text-primary-800`}
            >
              <span className="text-lg leading-none" aria-hidden>
                👍
              </span>
              {t("pickDetail.voteAgree", { n: pick.votes?.likes ?? 0 })}
            </a>
            <a
              href={issueUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={ui.btnSecondary}
            >
              <span className="text-lg leading-none" aria-hidden>
                👎
              </span>
              {t("pickDetail.voteDisagree", { n: pick.votes?.dislikes ?? 0 })}
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
        <section className="detail-rule mt-4 py-4">
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
