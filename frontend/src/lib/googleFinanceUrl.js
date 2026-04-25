/**
 * Public Google Finance quote URL (no scraping; link only).
 * @param {{ country?: string; market?: string; ticker?: string }} pick
 * @returns {string | null}
 */
export function googleFinanceQuoteUrl(pick) {
  const ticker = String(pick?.ticker ?? "").trim();
  if (!ticker) return null;
  if (pick.country === "KR") {
    const km = String(pick.market ?? "KRX").toUpperCase();
    const kex = km === "KOSDAQ" ? "KOSDAQ" : "KRX";
    return `https://www.google.com/finance/quote/${encodeURIComponent(ticker)}:${encodeURIComponent(kex)}`;
  }
  const m = String(pick.market ?? "NASDAQ").toUpperCase();
  const usExchanges = new Set(["NASDAQ", "NYSE", "NYSEARCA", "BATS", "NYSEAMERICAN"]);
  const ex = usExchanges.has(m) ? m : "NASDAQ";
  return `https://www.google.com/finance/quote/${encodeURIComponent(ticker)}:${encodeURIComponent(ex)}`;
}
