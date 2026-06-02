import { Link } from "react-router-dom";
import { isEntryPending } from "../../lib/pickEntry.js";
import { getPickDisplayReturnRate } from "../../lib/pickSignMismatch.js";
import { PickInstrumentHeading } from "./PickInstrumentHeading.jsx";
import { PickPriceDisplay } from "./PickPriceDisplay.jsx";
import { targetAchievementPercent } from "../../lib/pickProgressPct.js";
import { PickDeadline } from "./PickDeadline.jsx";
import { PickEntryPrice } from "./PickEntryPrice.jsx";
import { PickProgress } from "./PickProgress.jsx";
import { ReturnRate } from "./ReturnRate.jsx";
import { googleFinanceQuoteUrl } from "../../lib/googleFinanceUrl.js";
import { pickIssueUrl } from "../../lib/constants.js";
import { useI18n } from "../../i18n/I18nContext.jsx";
import { ui } from "../../lib/themeClasses.js";
import { type } from "../../lib/typographyClasses.js";
import { StatusBadge } from "./StatusBadge.jsx";
import { MetricBlock } from "../ui/MetricBlock.jsx";
import { ProgressBar } from "../ui/ProgressBar.jsx";

export function PickCard({ pick }) {
  const { t } = useI18n();
  const st = pick.status?.current;
  const issueUrl = pickIssueUrl(pick.issue_number);
  const financeUrl = googleFinanceQuoteUrl(pick);
  const progressPct = targetAchievementPercent(pick);
  const displayReturn = getPickDisplayReturnRate(pick);

  return (
    <article className={`flex h-full flex-col ${ui.card} overflow-hidden`}>
      <div className={`flex flex-1 flex-col ${ui.cardPad}`}>
        <header className="flex items-start justify-between gap-2">
          <PickInstrumentHeading pick={pick} variant="card" currentReturnRate={displayReturn} />
          <StatusBadge status={st} title={isEntryPending(pick) ? t("pick.pendingEntryHint") : undefined} />
        </header>

        <div className={`mt-4 ${ui.metricGrid} ${ui.innerPanel}`}>
          <MetricBlock label={t("pickCard.target")}>
            <ReturnRate rate={pick.target?.return_rate} className="text-base font-bold" />
          </MetricBlock>
          <MetricBlock label={t("pickCard.progress")} valueClass="text-sm">
            {isEntryPending(pick) ? (
              <span className={type.meta}>{t("pick.pendingProgress")}</span>
            ) : (
              <ReturnRate rate={displayReturn} className="text-base font-bold" />
            )}
          </MetricBlock>
        </div>

        <p className={`mt-3 ${type.meta}`}>
          <Link className={ui.link} to={`/user/${pick.author}`}>
            @{pick.author}
          </Link>
          {isEntryPending(pick) ? (
            <span>
              {" · "}
              <PickEntryPrice pick={pick} />
            </span>
          ) : null}
        </p>
        {!isEntryPending(pick) ? (
          <div className="mt-2">
            <PickPriceDisplay pick={pick} size="sm" />
          </div>
        ) : null}

        <footer className={`mt-3 flex flex-wrap items-center gap-3 text-xs text-zinc-400 light:text-zinc-600`}>
          <span className="inline-flex items-center gap-1">
            <PickDeadline pick={pick} />
          </span>
          <span>
            👍 {pick.votes?.likes ?? 0} · 👎 {pick.votes?.dislikes ?? 0}
          </span>
          {issueUrl ? (
            <a href={issueUrl} target="_blank" rel="noopener noreferrer" className={`${ui.link} text-xs`}>
              {t("pickCard.voteOnGithub")}
            </a>
          ) : null}
        </footer>
      </div>
      {progressPct != null ? (
        <div className="px-5 pb-1 pt-0 sm:px-6">
          <div
            className="h-1.5 overflow-hidden rounded-full bg-zinc-700 light:bg-zinc-200"
            role="progressbar"
            aria-valuenow={progressPct}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="h-full rounded-full bg-primary-500 light:bg-primary-600" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      ) : null}
    </article>
  );
}
