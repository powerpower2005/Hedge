import { BASE_URL, DATA_URLS, IS_REPOSITORY_CONFIGURED } from "./constants.js";
import { fetchJson, fetchJsonAllow404 } from "./fetchJson.js";

/** Earliest calendar year to probe for `data/archive/{year}.json` (404s ignored). */
export const ARCHIVE_PROBE_YEAR_MIN = 2015;

const CACHE_TTL_MS = 60_000;
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

/** @param {number | string} year */
export function dataArchiveJsonUrl(year) {
  if (!BASE_URL) return "";
  const y = String(year).replace(/\D/g, "");
  return `${BASE_URL}/data/archive/${y}.json`;
}

async function picksFromArchiveYears() {
  if (!IS_REPOSITORY_CONFIGURED || !BASE_URL) return [];
  const years = archiveYearsDescending();
  const jsons = await Promise.all(years.map((y) => fetchJsonAllow404(dataArchiveJsonUrl(y))));
  return jsons.flatMap((j) => j?.data?.picks ?? []);
}

async function loadHallArchiveUncached() {
  if (!IS_REPOSITORY_CONFIGURED) return [];
  const [hallJson, archivePicks] = await Promise.all([
    fetchJson(DATA_URLS.hallOfFame),
    picksFromArchiveYears(),
  ]);
  const hallPicks = hallJson?.data?.picks ?? [];
  return mergePicksById([archivePicks, hallPicks]);
}

async function loadAllPublicUncached() {
  if (!IS_REPOSITORY_CONFIGURED) return [];
  const years = archiveYearsDescending();
  const archiveUrls = years.map((y) => dataArchiveJsonUrl(y));
  const [activeJson, hallJson, expiredJson, ...archiveJsons] = await Promise.all([
    fetchJson(DATA_URLS.active),
    fetchJson(DATA_URLS.hallOfFame),
    fetchJson(DATA_URLS.expired),
    ...archiveUrls.map((u) => fetchJsonAllow404(u)),
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
  if (slot && Date.now() - slot.ts < CACHE_TTL_MS) return slot.picks;
  return null;
}

/**
 * @template T
 * @param {"all" | "hallArchive"} key
 * @param {() => Promise<T>} loader
 */
async function withCache(key, loader) {
  const slot = cacheSlots[key];
  if (slot && Date.now() - slot.ts < CACHE_TTL_MS) return /** @type {T} */ (slot.picks);
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
