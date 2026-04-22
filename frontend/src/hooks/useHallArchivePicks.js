import { useEffect, useState } from "react";
import { useDataCacheRevision } from "../context/DataCacheContext.jsx";
import { IS_REPOSITORY_CONFIGURED } from "../lib/constants.js";
import { loadHallArchivePicksCached } from "../lib/publicPickFetch.js";

export function useHallArchivePicks() {
  const dataRevision = useDataCacheRevision();
  const [picks, setPicks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    if (!IS_REPOSITORY_CONFIGURED) {
      setLoading(false);
      setError(new Error("Repository is not configured."));
      return undefined;
    }
    setLoading(true);
    loadHallArchivePicksCached()
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
