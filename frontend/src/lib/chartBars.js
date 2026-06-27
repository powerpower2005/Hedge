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
 * Session date used to slice pick-range bars (prefers locked close session).
 * @param {{ entry?: { date?: string, close_session_date?: string } }} pick
 * @returns {string | null} YYYY-MM-DD
 */
export function pickRangeStartDate(pick) {
  const entry = pick?.entry ?? {};
  const raw = entry.close_session_date ?? entry.date;
  if (typeof raw === "string" && raw.length >= 10) return raw.slice(0, 10);
  return null;
}

/**
 * @param {{ created_at?: string }} pick
 * @returns {string | null} YYYY-MM-DD
 */
function pickRegistrationDate(pick) {
  const raw = pick?.created_at;
  if (typeof raw === "string" && raw.length >= 10) return raw.slice(0, 10);
  return null;
}

/**
 * Pick tab: from entry session through the latest stored bar.
 * @param {Bar[]} bars
 * @param {{ entry?: { date?: string, close_session_date?: string }, created_at?: string }} pick
 * @returns {Bar[]}
 */
export function filterPickRangeBars(bars, pick) {
  const sorted = sortBarsByDate(bars);
  if (!sorted.length) return sorted;

  const start = pickRangeStartDate(pick);
  if (!start) return sorted;

  const filtered = sorted.filter((b) => b.date >= start);
  if (filtered.length) return filtered;

  const lastBarDate = sorted[sorted.length - 1].date;
  if (start > lastBarDate) {
    const reg = pickRegistrationDate(pick);
    const floor = reg && reg <= start ? reg : start;
    const lagBars = sorted.filter((b) => b.date >= floor && b.date <= lastBarDate);
    if (lagBars.length) return lagBars;
  }

  return filtered;
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
