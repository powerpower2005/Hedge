import { useEffect, useState } from "react";
import { useDataCacheRevision } from "../context/DataCacheContext.jsx";
import { IS_REPOSITORY_CONFIGURED } from "../lib/constants.js";
import { loadAllPublicPicksCached, peekAllPublicPicksIfFresh } from "../lib/publicPickFetch.js";

export function useAllMergedPicks() {
  const dataRevision = useDataCacheRevision();
  const cached = IS_REPOSITORY_CONFIGURED ? peekAllPublicPicksIfFresh() : null;
  const [picks, setPicks] = useState(() => cached ?? []);
  const [loading, setLoading] = useState(() => cached == null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    if (!IS_REPOSITORY_CONFIGURED) {
      setLoading(false);
      setError(new Error("Repository is not configured."));
      return undefined;
    }
    const warm = peekAllPublicPicksIfFresh();
    if (warm) {
      setPicks(warm);
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    loadAllPublicPicksCached()
      .then((p) => {
        if (!cancelled) setPicks(p);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e : new Error(String(e)));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [dataRevision]);

  return { picks, loading, error };
}
