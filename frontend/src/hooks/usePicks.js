import { useEffect, useState } from "react";
import { DATA_URLS } from "../lib/constants";

const CACHE_TTL = 60_000;
const cache = new Map();

export function usePicks(kind) {
  const [picks, setPicks] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const url = DATA_URLS[kind];
    if (!url) return undefined;

    const cached = cache.get(url);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      setPicks(cached.data.picks);
      setMeta(cached.data.meta);
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
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
        cache.set(url, { data, ts: Date.now() });
        setPicks(data.picks);
        setMeta(data.meta);
      })
      .catch((e) => {
        if (!cancelled) setError(e);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [kind]);

  return { picks, meta, loading, error };
}

export async function fetchJson(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}
