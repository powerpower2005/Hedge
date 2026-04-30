export function formatReturn(rate) {
  if (rate == null || Number.isNaN(rate)) return "—";
  return `${(rate * 100).toFixed(1)}%`;
}

export function formatPrice(country, price) {
  if (price == null || Number.isNaN(price)) return "—";
  if (country === "KR") return `₩${price.toLocaleString("ko-KR", { maximumFractionDigits: 0 })}`;
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
