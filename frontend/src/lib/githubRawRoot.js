import { DATA_CACHE_TTL_MS } from "./cacheConstants.js";
import { BRANCH, IS_REPOSITORY_CONFIGURED, REPO_NAME, REPO_OWNER } from "./constants.js";
import { invalidateUrlMetaCache } from "./urlMetaCache.js";
import { invalidateUrlPickCache } from "./urlPickListCache.js";

/**
 * Resolves `main` (or VITE_BRANCH) to the current commit SHA, then builds
 * `https://raw.githubusercontent.com/{owner}/{repo}/{sha}` so raw CDN keys
 * track the branch tip (public repos only; unauthenticated API).
 */
let shaCache = { sha: /** @type {string | null} */ (null), ts: 0 };

/** @type {Promise<string> | null} */
let resolveInflight = null;

/** Bumped on invalidate so in-flight ref resolves do not write stale SHAs. */
let resolveGeneration = 0;

export function invalidateResolvedShaCache() {
  resolveGeneration += 1;
  shaCache = { sha: null, ts: 0 };
  resolveInflight = null;
}

export async function getResolvedRawRootUrl() {
  if (!IS_REPOSITORY_CONFIGURED) return "";
  const now = Date.now();
  if (shaCache.sha && now - shaCache.ts < DATA_CACHE_TTL_MS) {
    return `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${shaCache.sha}`;
  }
  if (resolveInflight) return resolveInflight;

  const myGen = resolveGeneration;
  const task = (async () => {
    try {
      const refUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/git/refs/heads/${encodeURIComponent(BRANCH)}`;
      const r = await fetch(refUrl, {
        headers: {
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        cache: "no-store",
      });
      if (!r.ok) {
        const body = await r.text().catch(() => "");
        throw new Error(`GitHub ref API HTTP ${r.status} ${body.slice(0, 240)}`);
      }
      const j = await r.json();
      const sha = j?.object?.sha;
      if (!sha || typeof sha !== "string") throw new Error("GitHub ref response missing sha");
      if (myGen !== resolveGeneration) {
        return getResolvedRawRootUrl();
      }
      const prevSha = shaCache.sha;
      shaCache = { sha, ts: Date.now() };
      if (prevSha != null && prevSha !== sha) {
        invalidateUrlPickCache();
        invalidateUrlMetaCache();
      }
      return `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${sha}`;
    } finally {
      if (resolveInflight === task) resolveInflight = null;
    }
  })();
  resolveInflight = task;
  return task;
}

/** @returns {Promise<{ active: string, hallOfFame: string, expired: string, meta: string, version: string, rules: string }>} */
export async function getResolvedDataUrls() {
  const root = await getResolvedRawRootUrl();
  return {
    active: `${root}/data/active.json`,
    hallOfFame: `${root}/data/hall_of_fame.json`,
    expired: `${root}/data/expired_recent.json`,
    meta: `${root}/data/meta.json`,
    version: `${root}/VERSION`,
    rules: `${root}/config/rules.current.json`,
  };
}
