import { useCallback, useState } from "react";

const STORAGE_KEY = "hedge-market-sidebar-open";

function readStoredOpen() {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "0") return false;
    if (v === "1") return true;
  } catch {
    /* ignore */
  }
  return true;
}

function persistOpen(open) {
  try {
    localStorage.setItem(STORAGE_KEY, open ? "1" : "0");
  } catch {
    /* ignore */
  }
}

/** Desktop market-index rail open/closed (persisted in localStorage). */
export function useMarketSidebar() {
  const [open, setOpenState] = useState(readStoredOpen);

  const setOpen = useCallback((next) => {
    setOpenState(next);
    persistOpen(next);
  }, []);

  const toggle = useCallback(() => {
    setOpenState((prev) => {
      const next = !prev;
      persistOpen(next);
      return next;
    });
  }, []);

  return { open, setOpen, toggle };
}
