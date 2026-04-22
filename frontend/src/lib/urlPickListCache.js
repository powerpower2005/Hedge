import { DATA_CACHE_TTL_MS } from "./cacheConstants.js";

/** @typedef {{ picks: object[], meta: object }} ListCachePayload */

/** @type {Map<string, { data: ListCachePayload, ts: number }>} */
const cache = new Map();

/** @param {string} url */
export function readWarmUrlPickCache(url) {
  const c = cache.get(url);
  if (c && Date.now() - c.ts < DATA_CACHE_TTL_MS) return c.data;
  return null;
}

/** @param {string} url @param {ListCachePayload} data */
export function writeUrlPickCache(url, data) {
  cache.set(url, { data, ts: Date.now() });
}

export function invalidateUrlPickCache() {
  cache.clear();
}
