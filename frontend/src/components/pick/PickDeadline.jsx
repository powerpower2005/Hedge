import { useI18n } from "../../i18n/I18nContext.jsx";
import { deadlineDdayLabel } from "../../lib/formatters.js";
import { isEntryPending } from "../../lib/pickEntry.js";

export function PickDeadline({ pick, deadline, className = "" }) {
  const { t } = useI18n();
  if (pick && isEntryPending(pick)) {
    return <span className={`text-zinc-500 light:text-zinc-600 ${className}`.trim()}>{t("pick.pendingDeadline")}</span>;
  }
  const dl = deadline ?? pick?.duration?.deadline;
  if (!dl) return "—";
  const dday = deadlineDdayLabel(dl);
  const ddayClass =
    dday === "D-DAY"
      ? "font-bold text-zinc-300 light:text-zinc-700"
      : dday?.startsWith("D+")
        ? "font-semibold text-zinc-500 light:text-zinc-500"
        : "font-normal text-zinc-500 light:text-zinc-600";
  return (
    <span className={className}>
      <span className="tabular-nums">{dl}</span>
      {dday ? <span className={ddayClass}> ({dday})</span> : null}
    </span>
  );
}
