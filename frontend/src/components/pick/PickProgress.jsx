import { useI18n } from "../../i18n/I18nContext.jsx";
import { formatPrice } from "../../lib/formatters.js";
import { isEntryPending } from "../../lib/pickEntry.js";
import { ReturnRate } from "./ReturnRate.jsx";

/** Latest judgment return % and close used for progress. */
export function PickProgress({ pick }) {
  const { t } = useI18n();
  if (isEntryPending(pick)) {
    return <span className="text-zinc-500 light:text-zinc-600">{t("pick.pendingProgress")}</span>;
  }
  const rate = pick?.progress?.current?.return_rate;
  const close = pick?.progress?.current?.close;
  if (rate == null && close == null) return "—";
  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-1.5">
      <ReturnRate rate={rate} />
      {close != null && !Number.isNaN(close) ? (
        <>
          <span className="text-zinc-500 light:text-zinc-600" aria-hidden>
            ·
          </span>
          <span className="tabular-nums text-zinc-300 light:text-zinc-700">
            {formatPrice(pick.country, close)}
          </span>
        </>
      ) : null}
    </span>
  );
}
