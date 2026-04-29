import { DATA_CACHE_TTL_MS } from "./cacheConstants.js";

/** @type {Map<string, { raw: object, ts: number }>} */
const cache = new Map();

/** @param {string} url */
export function readWarmUrlMetaCache(url) {
  const c = cache.get(url);
  if (c && Date.now() - c.ts < DATA_CACHE_TTL_MS) return c.raw;
  return null;
}

/** @param {string} url @param {object} raw */
export function writeUrlMetaCache(url, raw) {
  cache.set(url, { raw, ts: Date.now() });
}

export function invalidateUrlMetaCache() {
  cache.clear();
}
