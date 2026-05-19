import { useI18n } from "../../i18n/I18nContext.jsx";
import { formatPrice } from "../../lib/formatters.js";
import { hasEntryPrice, isEntryPending } from "../../lib/pickEntry.js";

export function PickEntryPrice({ pick }) {
  const { t } = useI18n();
  if (isEntryPending(pick)) {
    return <span className="text-zinc-500 light:text-zinc-600">{t("pick.pendingEntry")}</span>;
  }
  if (!hasEntryPrice(pick)) return "—";
  return <span className="tabular-nums">{formatPrice(pick.country, pick.entry.price)}</span>;
}
