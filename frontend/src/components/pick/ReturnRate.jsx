import { formatReturn, returnRateColorClass } from "../../lib/formatters.js";

export function ReturnRate({ rate, className = "" }) {
  const color = returnRateColorClass(rate);
  const extra = className ? ` ${className}` : "";
  return <span className={`tabular-nums${color ? ` ${color}` : ""}${extra}`}>{formatReturn(rate)}</span>;
}
