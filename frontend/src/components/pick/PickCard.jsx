import { Link } from "react-router-dom";
import { formatPrice, formatReturn } from "../../lib/formatters.js";
import { googleFinanceQuoteUrl } from "../../lib/googleFinanceUrl.js";
import { pickIssueUrl } from "../../lib/constants.js";
import { useI18n } from "../../i18n/I18nContext.jsx";
import { StatusBadge } from "./StatusBadge.jsx";

export function PickCard({ pick }) {
  const { t } = useI18n();
  const st = pick.status?.current;
  const issueUrl = pickIssueUrl(pick.issue_number);
  const financeUrl = googleFinanceQuoteUrl(pick);
  return (
    <article className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 shadow-sm light:border-zinc-200 light:bg-white">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <Link
            to={`/pick/${pick.id}`}
            className="text-lg font-semibold text-white hover:text-emerald-400 light:text-zinc-900 light:hover:text-emerald-700"
          >
            {pick.ticker}
          </Link>
          {pick.instrument_name ? (
            <p className="text-sm font-medium text-zinc-300 light:text-zinc-700">{pick.instrument_name}</p>
          ) : financeUrl ? (
            <p className="text-sm">
              <a
                href={financeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-emerald-500 hover:underline light:text-emerald-700"
              >
                {t("pickCard.nameOnGoogleFinance")}
              </a>
            </p>
          ) : null}
          <p className="text-sm text-zinc-400 light:text-zinc-600">
            {pick.market} ·{" "}
            <Link className="hover:underline" to={`/user/${pick.author}`}>
              @{pick.author}
            </Link>
          </p>
        </div>
        <StatusBadge status={st} />
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div>
          <dt className="text-zinc-500 light:text-zinc-600">{t("pickCard.target")}</dt>
          <dd>{formatReturn(pick.target?.return_rate)}</dd>
        </div>
        <div>
          <dt className="text-zinc-500 light:text-zinc-600">{t("pickCard.deadline")}</dt>
          <dd>{pick.duration?.deadline || "\u2014"}</dd>
        </div>
        <div>
          <dt className="text-zinc-500 light:text-zinc-600">{t("pickCard.entry")}</dt>
          <dd>{formatPrice(pick.country, pick.entry?.price)}</dd>
        </div>
        <div>
          <dt className="text-zinc-500 light:text-zinc-600">{t("pickCard.progress")}</dt>
          <dd>{formatReturn(pick.progress?.current?.return_rate)}</dd>
        </div>
      </dl>
      <div className="mt-2 space-y-1 text-xs text-zinc-500 light:text-zinc-600">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span>
            {t("pickCard.votes")}: +{pick.votes?.likes ?? 0} / -{pick.votes?.dislikes ?? 0}
          </span>
          {issueUrl ? (
            <a
              href={issueUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-emerald-500 hover:underline light:text-emerald-700"
            >
              {t("pickCard.voteOnGithub")}
            </a>
          ) : null}
        </div>
        {issueUrl ? <p className="text-[11px] leading-snug">{t("pickCard.voteHint")}</p> : null}
      </div>
    </article>
  );
}
