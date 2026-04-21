import { Link } from "react-router-dom";
import { formatPrice, formatReturn } from "../../lib/formatters.js";
import { StatusBadge } from "./StatusBadge.jsx";

export function PickCard({ pick }) {
  const st = pick.status?.current;
  return (
    <article className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 shadow-sm dark:border-zinc-200 dark:bg-white">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <Link
            to={`/pick/${pick.id}`}
            className="text-lg font-semibold text-white hover:text-emerald-400 dark:text-zinc-900 dark:hover:text-emerald-700"
          >
            {pick.ticker}
          </Link>
          <p className="text-sm text-zinc-400 dark:text-zinc-600">
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
          <dt className="text-zinc-500 dark:text-zinc-500">Target</dt>
          <dd>{formatReturn(pick.target?.return_rate)}</dd>
        </div>
        <div>
          <dt className="text-zinc-500 dark:text-zinc-500">Deadline</dt>
          <dd>{pick.duration?.deadline || "—"}</dd>
        </div>
        <div>
          <dt className="text-zinc-500 dark:text-zinc-500">Entry</dt>
          <dd>{formatPrice(pick.country, pick.entry?.price)}</dd>
        </div>
        <div>
          <dt className="text-zinc-500 dark:text-zinc-500">Progress</dt>
          <dd>{formatReturn(pick.progress?.current?.return_rate)}</dd>
        </div>
      </dl>
      <div className="mt-2 text-xs text-zinc-500">
        Votes: +{pick.votes?.likes ?? 0} / -{pick.votes?.dislikes ?? 0}
      </div>
    </article>
  );
}
