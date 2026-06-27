/** @typedef {{ date: string, open: number, high: number, low: number, close: number, volume?: number }} Bar */

export const DETAIL_TRADING_BARS = 250;

/**
 * @param {Bar[]} bars
 * @returns {Bar[]}
 */
export function sortBarsByDate(bars) {
  return [...bars].sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Pick tab: from entry date through the latest stored bar.
 * @param {Bar[]} bars
 * @param {{ entry?: { date?: string } }} pick
 * @returns {Bar[]}
 */
export function filterPickRangeBars(bars, pick) {
  const sorted = sortBarsByDate(bars);
  const entryRaw = pick?.entry?.date;
  if (typeof entryRaw !== "string" || entryRaw.length < 10) {
    return sorted;
  }
  const entryDate = entryRaw.slice(0, 10);
  return sorted.filter((b) => b.date >= entryDate);
}

/**
 * Detail tab: most recent N trading bars.
 * @param {Bar[]} bars
 * @param {number} [limit]
 * @returns {Bar[]}
 */
export function filterDetailTradingBars(bars, limit = DETAIL_TRADING_BARS) {
  const sorted = sortBarsByDate(bars);
  if (sorted.length <= limit) return sorted;
  return sorted.slice(-limit);
}

/**
 * @param {Bar[]} bars
 * @param {"pick" | "detail"} mode
 * @param {{ entry?: { date?: string } }} pick
 * @returns {Bar[]}
 */
export function filterChartBars(bars, mode, pick) {
  if (mode === "detail") return filterDetailTradingBars(bars);
  return filterPickRangeBars(bars, pick);
}
