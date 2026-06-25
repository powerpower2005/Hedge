import { BARS_SUPPORTED_COUNTRIES } from "./instrumentBars.js";
import { getResolvedRawRootUrl } from "./githubRawRoot.js";

export { BARS_SUPPORTED_COUNTRIES };

/**
 * @param {{ country?: string; market?: string; ticker?: string }} pick
 * @returns {string | null}
 */
export function instrumentBarsPath(pick) {
  const country = String(pick?.country ?? "").trim().toUpperCase();
  const market = String(pick?.market ?? "").trim().toUpperCase();
  const ticker = String(pick?.ticker ?? "").trim().toUpperCase();
  if (!country || !market || !ticker) return null;
  return `data/bars/v1/${country}/${market}/${ticker}.json`;
}

/**
 * @param {{ country?: string; market?: string; ticker?: string }} pick
 * @returns {Promise<string | null>}
 */
export async function instrumentBarsUrl(pick) {
  const rel = instrumentBarsPath(pick);
  if (!rel) return null;
  const root = await getResolvedRawRootUrl();
  if (!root) return null;
  return `${root}/${rel}`;
}

/**
 * @param {{ country?: string }} pick
 * @returns {boolean}
 */
export function isBarsChartSupported(pick) {
  return BARS_SUPPORTED_COUNTRIES.has(String(pick?.country ?? "").toUpperCase());
}

/**
 * @param {{ country?: string }} pick
 * @returns {boolean}
 */
export function isBarsChartJpDeferred(pick) {
  return String(pick?.country ?? "").toUpperCase() === "JP";
}
