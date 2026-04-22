import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { StatusBadge } from "../components/pick/StatusBadge.jsx";
import { useDataCacheRevision } from "../context/DataCacheContext.jsx";
import { IS_REPOSITORY_CONFIGURED, pickIssueUrl } from "../lib/constants.js";
import { useI18n } from "../i18n/I18nContext.jsx";
import { formatPrice, formatReturn } from "../lib/formatters.js";
import { loadAllPublicPicksCached } from "../lib/publicPickFetch.js";
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

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link to="/" className="text-sm text-emerald-500 hover:underline">
        {t("common.backToList")}
      </Link>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-bold text-white light:text-zinc-900">{pick.ticker}</h1>
        <StatusBadge status={pick.status?.current} />
      </div>
      <p className="text-zinc-400 light:text-zinc-600">
        @{pick.author} · {pick.market} · {t("pickDetail.refLine", { n: pick.issue_number })}
      </p>
      <dl className="mt-6 space-y-3 text-sm">
        <div className="flex justify-between border-b border-zinc-800 py-2 light:border-zinc-200">
          <dt className="text-zinc-500 light:text-zinc-600">{t("pickDetail.entry")}</dt>
          <dd>{formatPrice(pick.country, pick.entry?.price)}</dd>
        </div>
        <div className="flex justify-between border-b border-zinc-800 py-2 light:border-zinc-200">
          <dt className="text-zinc-500 light:text-zinc-600">{t("pickDetail.targetReturn")}</dt>
          <dd>{formatReturn(pick.target?.return_rate)}</dd>
        </div>
        <div className="flex justify-between border-b border-zinc-800 py-2 light:border-zinc-200">
          <dt className="text-zinc-500 light:text-zinc-600">{t("pickDetail.targetPrice")}</dt>
          <dd>{formatPrice(pick.country, pick.target?.price)}</dd>
        </div>
        <div className="flex justify-between border-b border-zinc-800 py-2 light:border-zinc-200">
          <dt className="text-zinc-500 light:text-zinc-600">{t("pickDetail.deadline")}</dt>
          <dd>{pick.duration?.deadline}</dd>
        </div>
        <div className="flex justify-between border-b border-zinc-800 py-2 light:border-zinc-200">
          <dt className="text-zinc-500 light:text-zinc-600">{t("pickDetail.currentReturn")}</dt>
          <dd>{formatReturn(pick.progress?.current?.return_rate)}</dd>
        </div>
        <div className="flex justify-between border-b border-zinc-800 py-2 light:border-zinc-200">
          <dt className="text-zinc-500 light:text-zinc-600">{t("pickDetail.votes")}</dt>
          <dd>{t("pickDetail.votesTally", { likes: pick.votes?.likes ?? 0, dislikes: pick.votes?.dislikes ?? 0 })}</dd>
        </div>
      </dl>
      {issueUrl ? (
        <div className="mt-6 rounded-lg border border-zinc-800 bg-zinc-900/30 p-4 text-sm light:border-zinc-200 light:bg-zinc-50">
          <p className="font-medium text-white light:text-zinc-900">{t("pickDetail.voteCtaTitle")}</p>
          <p className="mt-2 text-zinc-400 light:text-zinc-600">{t("pickDetail.voteCtaBody")}</p>
          <a
            href={issueUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block font-medium text-emerald-500 hover:underline light:text-emerald-700"
          >
            {t("pickDetail.openIssue", { n: pick.issue_number })}
          </a>
        </div>
      ) : null}
      {pick.achievement && (
        <div className="mt-6 rounded-lg bg-amber-950/40 p-4 text-sm light:bg-amber-50">
          <p className="font-medium text-amber-200 light:text-amber-900">{t("pickDetail.achieved")}</p>
          <p className="text-zinc-300 light:text-zinc-700">
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
