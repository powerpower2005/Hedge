import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { invalidateResolvedShaCache } from "../lib/githubRawRoot.js";
import { invalidatePublicPickFetchCache } from "../lib/publicPickFetch.js";
import { invalidateUrlMetaCache } from "../lib/urlMetaCache.js";
import { invalidateUrlPickCache } from "../lib/urlPickListCache.js";

const DataCacheContext = createContext({
  revision: 0,
  invalidateDataCaches: () => {},
});

export function DataCacheProvider({ children }) {
  const [revision, setRevision] = useState(0);
  const invalidateDataCaches = useCallback(() => {
    invalidateResolvedShaCache();
    invalidatePublicPickFetchCache();
    invalidateUrlPickCache();
    invalidateUrlMetaCache();
    setRevision((r) => r + 1);
  }, []);

  const value = useMemo(
    () => ({ revision, invalidateDataCaches }),
    [revision, invalidateDataCaches],
  );

  return <DataCacheContext.Provider value={value}>{children}</DataCacheContext.Provider>;
}

export function useDataCacheRevision() {
  return useContext(DataCacheContext).revision;
}

export function useInvalidateDataCaches() {
  return useContext(DataCacheContext).invalidateDataCaches;
}
