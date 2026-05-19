import { deadlineDdayLabel } from "../../lib/formatters.js";

export function PickDeadline({ deadline, className = "" }) {
  if (!deadline) return "—";
  const dday = deadlineDdayLabel(deadline);
  const ddayClass =
    dday === "D-DAY"
      ? "font-medium text-amber-400 light:text-amber-700"
      : dday?.startsWith("D+")
        ? "text-red-400/90 light:text-red-600"
        : "text-zinc-500 light:text-zinc-600";
  return (
    <span className={className}>
      <span className="tabular-nums">{deadline}</span>
      {dday ? <span className={ddayClass}> ({dday})</span> : null}
    </span>
  );
}
