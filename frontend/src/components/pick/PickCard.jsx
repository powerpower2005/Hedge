import { Link } from "react-router-dom";
import { formatPrice, formatReturn } from "../../lib/formatters.js";
import { isEntryPending } from "../../lib/pickEntry.js";
import { PickDeadline } from "./PickDeadline.jsx";
import { PickEntryPrice } from "./PickEntryPrice.jsx";
import { PickProgress } from "./PickProgress.jsx";
import { ReturnRate } from "./ReturnRate.jsx";
import { googleFinanceQuoteUrl } from "../../lib/googleFinanceUrl.js";
import { pickIssueUrl } from "../../lib/constants.js";
import { useI18n } from "../../i18n/I18nContext.jsx";
import { type } from "../../lib/typographyClasses.js";
import { StatusBadge } from "./StatusBadge.jsx";

export function PickCard({ pick }) {
  const { t } = useI18n();
  const st = pick.status?.current;
  const issueUrl = pickIssueUrl(pick.issue_number);
  const financeUrl = googleFinanceQuoteUrl(pick);
  const registeredOn =
    typeof pick.created_at === "string" && pick.created_at.length >= 10
      ? pick.created_at.slice(0, 10)
      : pick.entry?.date || null;
  return (
    <article className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 shadow-sm light:border-zinc-200 light:bg-white">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <Link to={`/pick/${pick.id}`} className={`hover:underline ${type.cardTitle}`}>
            {pick.instrument_name || pick.ticker}
          </Link>
          {pick.instrument_name ? (
            <p className={type.meta}>{pick.ticker}</p>
          ) : financeUrl ? (
            <p className={type.meta}>
              <a href={financeUrl} target="_blank" rel="noopener noreferrer" className="font-medium hover:underline">
                {t("pickCard.nameOnGoogleFinance")}
              </a>
            </p>
          ) : null}
          <p className={type.meta}>
            {pick.market} ·{" "}
            <Link className="font-medium hover:underline" to={`/user/${pick.author}`}>
              @{pick.author}
            </Link>
            {registeredOn ? <span> · {registeredOn}</span> : null}
            {st === "achieved" && pick.achievement?.achieved_date ? (
              <span className="font-semibold"> · {pick.achievement.achieved_date}</span>
            ) : null}
          </p>
        </div>
        <StatusBadge
          status={st}
          title={isEntryPending(pick) ? t("pick.pendingEntryHint") : undefined}
        />
      </header>
      <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4 border-t border-zinc-800/80 pt-4 light:border-zinc-200">
        <div>
          <dt className={type.fieldLabel}>{t("pickCard.target")}</dt>
          <dd className={`mt-1 ${type.fieldValue}`}>
            <ReturnRate rate={pick.target?.return_rate} />
            {isEntryPending(pick) ? (
              <span className={`mt-1 block ${type.meta}`}>{t("pick.pendingTargetPrice")}</span>
            ) : null}
          </dd>
        </div>
        <div>
          <dt className={type.fieldLabel}>{t("pickCard.deadline")}</dt>
          <dd className={`mt-1 ${type.fieldValue}`}>
            <PickDeadline pick={pick} />
          </dd>
        </div>
        <div>
          <dt className={type.fieldLabel}>{t("pickCard.entry")}</dt>
          <dd className={`mt-1 ${type.fieldValue}`}>
            <PickEntryPrice pick={pick} />
          </dd>
        </div>
        <div>
          <dt className={type.fieldLabel}>{t("pickCard.progress")}</dt>
          <dd className={`mt-1 ${type.fieldValue}`}>
            <PickProgress pick={pick} />
          </dd>
        </div>
      </dl>
      <footer className={`mt-4 space-y-1 border-t border-zinc-800/80 pt-3 ${type.meta} light:border-zinc-200`}>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span>
            {t("pickCard.votes")}: +{pick.votes?.likes ?? 0} / -{pick.votes?.dislikes ?? 0}
          </span>
          {issueUrl ? (
            <a
              href={issueUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold hover:underline"
            >
              {t("pickCard.voteOnGithub")}
            </a>
          ) : null}
        </div>
        {issueUrl ? <p className={type.metaSm}>{t("pickCard.voteHint")}</p> : null}
      </footer>
    </article>
  );
}

