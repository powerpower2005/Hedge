export function formatReturn(rate) {
  if (rate == null || Number.isNaN(rate)) return "—";
  const pct = rate * 100;
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}%`;
}

/** Win rate 0–100% — no +/- prefix. */
export function formatWinRate(rate) {
  if (rate == null || Number.isNaN(rate)) return "—";
  return `${(rate * 100).toFixed(1)}%`;
}

/** Tailwind classes for signed return (target prediction or live progress). */
export function returnRateColorClass(rate) {
  if (rate == null || Number.isNaN(rate)) return "";
  if (rate < 0) return "text-red-300 light:text-red-700";
  if (rate > 0) return "text-primary-300 light:text-primary-700";
  return "text-zinc-300 light:text-zinc-700";
}

/**
 * Calendar-day countdown label for a YYYY-MM-DD deadline (local timezone).
 * @param {string | null | undefined} deadlineIso
 * @returns {string | null} e.g. D-7, D-DAY, D+2
 */
export function deadlineDdayLabel(deadlineIso) {
  if (deadlineIso == null || typeof deadlineIso !== "string") return null;
  const match = deadlineIso.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const y = Number(match[1]);
  const mo = Number(match[2]);
  const d = Number(match[3]);
  if (!y || mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  const today = new Date();
  const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const deadlineUtc = Date.UTC(y, mo - 1, d);
  const diff = Math.round((deadlineUtc - todayUtc) / 86400000);
  if (diff === 0) return "D-DAY";
  if (diff > 0) return `D-${diff}`;
  return `D+${Math.abs(diff)}`;
}

export function formatPrice(country, price) {
  if (price == null || Number.isNaN(price)) return "—";
  if (country === "KR") return `₩${price.toLocaleString("ko-KR", { maximumFractionDigits: 0 })}`;
  if (country === "HK") return `HK$${price.toLocaleString("en-HK", { minimumFractionDigits: 2, maximumFractionDigits: 3 })}`;
  if (country === "JP") return `¥${price.toLocaleString("ja-JP", { maximumFractionDigits: 0 })}`;
  return `$${price.toFixed(2)}`;
}

/**
 * @param {string | null | undefined} iso
 * @param {"ko" | "en"} locale
 */
export function formatJudgmentUtc(iso, locale) {
  if (iso == null || typeof iso !== "string" || !iso.trim()) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const loc = locale === "en" ? "en-US" : "ko-KR";
  return new Intl.DateTimeFormat(loc, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  }).format(d);
}
