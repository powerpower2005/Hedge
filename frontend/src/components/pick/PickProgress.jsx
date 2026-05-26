import { useI18n } from "../../i18n/I18nContext.jsx";
import { formatPrice } from "../../lib/formatters.js";
import { isEntryPending } from "../../lib/pickEntry.js";
import { formatSessionDateDisplay, getExpirySnapshot, isExpiredPick } from "../../lib/pickPrices.js";
import { ReturnRate } from "./ReturnRate.jsx";

/** Latest judgment return % and close used for progress. */
export function PickProgress({ pick }) {
  const { t } = useI18n();
  if (isEntryPending(pick)) {
    return <span className="text-zinc-500 light:text-zinc-600">{t("pick.pendingProgress")}</span>;
  }
  const expired = isExpiredPick(pick);
  const expiry = expired ? getExpirySnapshot(pick) : null;
  const rate =
    expired && expiry?.return_rate != null ? expiry.return_rate : pick?.progress?.current?.return_rate;
  const close = expired && expiry ? expiry.close : pick?.progress?.current?.close;
  const dateLabel =
    expired && expiry?.session_date ? formatSessionDateDisplay(expiry.session_date) : null;
  if (rate == null && close == null) return "—";
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
