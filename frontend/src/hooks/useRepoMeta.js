import { useEffect, useState } from "react";
import { useDataCacheRevision } from "../context/DataCacheContext.jsx";
import { IS_REPOSITORY_CONFIGURED } from "../lib/constants.js";
import { getResolvedDataUrls } from "../lib/githubRawRoot.js";
import { fetchJson } from "../lib/fetchJson.js";
import { readWarmUrlMetaCache, writeUrlMetaCache } from "../lib/urlMetaCache.js";

/**
 * Loads `data/meta.json` (e.g. `last_daily_judgment_at` from daily_judgment).
 * @returns {{ lastDailyJudgmentAt: string | null, loading: boolean, error: Error | null }}
 */
export function useRepoMeta() {
  const dataRevision = useDataCacheRevision();
  const [lastDailyJudgmentAt, setLastDailyJudgmentAt] = useState(/** @type {string | null} */ (null));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(/** @type {Error | null} */ (null));

  useEffect(() => {
    if (!IS_REPOSITORY_CONFIGURED) {
      setLoading(false);
      setLastDailyJudgmentAt(null);
      setError(null);
      return undefined;
    }

    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const urls = await getResolvedDataUrls();
        const url = urls.meta;
        const warm = readWarmUrlMetaCache(url);
        if (warm) {
          if (!cancelled) {
            const v = warm.last_daily_judgment_at;
            setLastDailyJudgmentAt(typeof v === "string" && v.trim() ? v.trim() : null);
            setLoading(false);
          }
          return;
        }
        const json = await fetchJson(url);
        writeUrlMetaCache(url, json);
        if (cancelled) return;
        const v = json?.last_daily_judgment_at;
        setLastDailyJudgmentAt(typeof v === "string" && v.trim() ? v.trim() : null);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e : new Error(String(e)));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [dataRevision]);

  return { lastDailyJudgmentAt, loading, error };
}
