import { DATA_CACHE_TTL_MS } from "./cacheConstants.js";
import { IS_REPOSITORY_CONFIGURED } from "./constants.js";
import { getResolvedRawRootUrl } from "./githubRawRoot.js";
import { fetchJson, fetchJsonAllow404 } from "./fetchJson.js";

/** Earliest calendar year to probe for `data/archive/{year}.json` (404s ignored). */
export const ARCHIVE_PROBE_YEAR_MIN = 2015;
const cacheSlots = {
  all: /** @type {{ ts: number, picks: object[] } | null} */ (null),
  hallArchive: /** @type {{ ts: number, picks: object[] } | null} */ (null),
};

/** @type {Record<string, Promise<object[]> | null>} */
const inflight = { all: null, hallArchive: null };

/**
 * @param {object[][]} listsOldestOrLowestPriorityFirst later arrays overwrite same `id`
 * @returns {object[]}
 */
export function mergePicksById(listsOldestOrLowestPriorityFirst) {
  const map = new Map();
  for (const list of listsOldestOrLowestPriorityFirst) {
    for (const p of list || []) {
      if (p == null || p.id == null) continue;
      map.set(p.id, p);
    }
  }
  return [...map.values()];
}

export function archiveYearsDescending() {
  const maxY = new Date().getUTCFullYear();
  const years = [];
  for (let y = maxY; y >= ARCHIVE_PROBE_YEAR_MIN; y -= 1) years.push(y);
  return years;
}

async function picksFromArchiveYears() {
  if (!IS_REPOSITORY_CONFIGURED) return [];
  const root = await getResolvedRawRootUrl();
  if (!root) return [];
  const years = archiveYearsDescending();
  const jsons = await Promise.all(
    years.map((y) => {
      const yy = String(y).replace(/\D/g, "");
      return fetchJsonAllow404(`${root}/data/archive/${yy}.json`);
    }),
  );
  return jsons.flatMap((j) => j?.data?.picks ?? []);
}

async function loadHallArchiveUncached() {
  if (!IS_REPOSITORY_CONFIGURED) return [];
  const root = await getResolvedRawRootUrl();
  if (!root) return [];
  const [hallJson, archivePicks] = await Promise.all([
    fetchJson(`${root}/data/hall_of_fame.json`),
    picksFromArchiveYears(),
  ]);
  const hallPicks = hallJson?.data?.picks ?? [];
  return mergePicksById([archivePicks, hallPicks]);
}

async function loadAllPublicUncached() {
  if (!IS_REPOSITORY_CONFIGURED) return [];
  const root = await getResolvedRawRootUrl();
  if (!root) return [];
  const years = archiveYearsDescending();
  const [activeJson, hallJson, expiredJson, ...archiveJsons] = await Promise.all([
    fetchJson(`${root}/data/active.json`),
    fetchJson(`${root}/data/hall_of_fame.json`),
    fetchJson(`${root}/data/expired_recent.json`),
    ...years.map((y) => {
      const yy = String(y).replace(/\D/g, "");
      return fetchJsonAllow404(`${root}/data/archive/${yy}.json`);
    }),
  ]);
  const active = activeJson?.data?.picks ?? [];
  const hall = hallJson?.data?.picks ?? [];
  const expired = expiredJson?.data?.picks ?? [];
  const archivePicks = archiveJsons.flatMap((j) => j?.data?.picks ?? []);
  return mergePicksById([archivePicks, expired, hall, active]);
}

/**
 * Returns merged picks if TTL cache is still fresh (same window as `loadAllPublicPicksCached`).
 * @returns {object[] | null}
 */
export function peekAllPublicPicksIfFresh() {
  const slot = cacheSlots.all;
  if (slot && Date.now() - slot.ts < DATA_CACHE_TTL_MS) return slot.picks;
  return null;
}

/**
 * @template T
 * @param {"all" | "hallArchive"} key
 * @param {() => Promise<T>} loader
 */
async function withCache(key, loader) {
  const slot = cacheSlots[key];
  if (slot && Date.now() - slot.ts < DATA_CACHE_TTL_MS) return /** @type {T} */ (slot.picks);
  const pending = inflight[key];
  if (pending) return /** @type {T} */ (pending);
  const task = (async () => {
    try {
      const picks = await loader();
      cacheSlots[key] = { ts: Date.now(), picks };
      return /** @type {T} */ (picks);
    } finally {
      inflight[key] = null;
    }
  })();
  inflight[key] = task;
  return task;
}

export function loadHallArchivePicksCached() {
  return withCache("hallArchive", loadHallArchiveUncached);
}

export function loadAllPublicPicksCached() {
  return withCache("all", loadAllPublicUncached);
}

/** Clears merged pick caches so the next fetch hits the network again. */
export function invalidatePublicPickFetchCache() {
  cacheSlots.all = null;
  cacheSlots.hallArchive = null;
  inflight.all = null;
  inflight.hallArchive = null;
}
