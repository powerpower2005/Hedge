import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useDataCacheRevision } from "../context/DataCacheContext.jsx";
import { IS_REPOSITORY_CONFIGURED } from "../lib/constants.js";
import { loadAllPublicPicksCached } from "../lib/publicPickFetch.js";

export function usePickById() {
  const { id } = useParams();
  const dataRevision = useDataCacheRevision();
  const [pick, setPick] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const want = Number(id);
    setPick(null);
    setErr(null);
    (async () => {
      if (!IS_REPOSITORY_CONFIGURED) {
        if (!cancelled) setErr({ code: "loadfailed" });
        return;
      }
      try {
        const merged = await loadAllPublicPicksCached();
        const found = merged.find((p) => p.id === want);
        if (!cancelled) {
          if (found) setPick(found);
          else setErr({ code: "notfound" });
        }
      } catch (e) {
        if (!cancelled) setErr({ code: "loadfailed", dev: String(e?.message ?? e) });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, dataRevision]);

  return { pick, err, pickId: id };
}
