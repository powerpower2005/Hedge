import { useEffect, useState } from "react";
import { useDataCacheRevision } from "../context/DataCacheContext.jsx";
import { IS_REPOSITORY_CONFIGURED } from "../lib/constants";
import { getResolvedDataUrls } from "../lib/githubRawRoot.js";
import { fetchJson } from "../lib/fetchJson.js";
import { readWarmUrlPickCache, writeUrlPickCache } from "../lib/urlPickListCache.js";

export function usePicks(kind) {
  const dataRevision = useDataCacheRevision();
  const [picks, setPicks] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!IS_REPOSITORY_CONFIGURED) {
      setLoading(false);
      setError(new Error("Repository is not configured."));
      return undefined;
    }

    let cancelled = false;

    (async () => {
      let url = "";
      try {
        const urls = await getResolvedDataUrls();
        url = kind === "expired" ? urls.expired : urls.active;
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e : new Error(String(e)));
          setLoading(false);
        }
        return;
      }

      const warm = readWarmUrlPickCache(url);
      if (warm) {
        if (!cancelled) {
          setPicks(warm.picks);
          setMeta(warm.meta);
          setLoading(false);
        }
        return;
      }

      if (!cancelled) {
        setLoading(true);
        setError(null);
      }
      fetchJson(url)
        .then((json) => {
          if (cancelled) return;
          const data = {
            picks: json.data?.picks ?? [],
            meta: {
              schemaVersion: json.schema_version,
              generator: json.generator,
              generatedAt: json.generated_at,
              count: json.data?.count ?? 0,
            },
          };
          writeUrlPickCache(url, data);
          setPicks(data.picks);
          setMeta(data.meta);
        })
        .catch((e) => {
          if (!cancelled) setError(e);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    })();

    return () => {
      cancelled = true;
    };
  }, [kind, dataRevision]);

  return { picks, meta, loading, error };
}
