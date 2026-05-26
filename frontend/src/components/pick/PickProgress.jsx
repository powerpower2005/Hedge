import { useI18n } from "../../i18n/I18nContext.jsx";
import { formatPrice } from "../../lib/formatters.js";
import { isEntryPending } from "../../lib/pickEntry.js";
import {
  formatSessionDateDisplay,
  getAchievementSnapshot,
  getExpirySnapshot,
  isAchievedPick,
  isExpiredPick,
} from "../../lib/pickPrices.js";
import { getPickDisplayReturnRate } from "../../lib/pickSignMismatch.js";
import { ReturnRate } from "./ReturnRate.jsx";

/** Latest judgment return % and close used for progress. */
export function PickProgress({ pick }) {
  const { t } = useI18n();
  if (isEntryPending(pick)) {
    return <span className="text-zinc-500 light:text-zinc-600">{t("pick.pendingProgress")}</span>;
  }
  const achieved = isAchievedPick(pick);
  const achievement = achieved ? getAchievementSnapshot(pick) : null;
  const expired = isExpiredPick(pick);
  const expiry = expired ? getExpirySnapshot(pick) : null;

  if (achieved && !achievement) {
    return <span className="text-zinc-500 light:text-zinc-600">{t("common.notAvailable")}</span>;
  }
  if (expired && !expiry) {
    return <span className="text-zinc-500 light:text-zinc-600">{t("common.notAvailable")}</span>;
  }

  const rate = getPickDisplayReturnRate(pick);
  const close = achievement?.close ?? expiry?.close ?? pick?.progress?.current?.close;
  const sessionDate = achievement?.session_date ?? expiry?.session_date;
  const dateLabel = sessionDate ? formatSessionDateDisplay(sessionDate) : null;
  if (rate == null && (close == null || Number.isNaN(close))) return "—";
  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-1.5">
      <ReturnRate rate={rate} />
      {close != null && !Number.isNaN(close) ? (
        <>
          <span className="text-zinc-500 light:text-zinc-600" aria-hidden>
            ·
          </span>
          <span className="tabular-nums font-medium text-zinc-200 light:text-zinc-800">
            {formatPrice(pick.country, close)}
          </span>
          {dateLabel ? (
            <span className="text-zinc-500 light:text-zinc-600">({dateLabel})</span>
          ) : null}
        </>
      ) : null}
    </span>
  );
}
