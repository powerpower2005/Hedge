/**
 * Public Google Finance quote URL (no scraping; link only).
 * @param {{ country?: string; market?: string; ticker?: string }} pick
 * @returns {string | null}
 */
export function googleFinanceQuoteUrl(pick) {
  const ticker = String(pick?.ticker ?? "").trim();
  if (!ticker) return null;
  if (pick.country === "KR") {
    return `https://www.google.com/finance/quote/${encodeURIComponent(ticker)}:KRX`;
  }
  const m = String(pick.market ?? "NASDAQ").toUpperCase();
  const ex = m === "NYSE" ? "NYSE" : "NASDAQ";
  return `https://www.google.com/finance/quote/${encodeURIComponent(ticker)}:${encodeURIComponent(ex)}`;
}
