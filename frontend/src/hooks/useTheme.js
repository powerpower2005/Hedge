import { useCallback, useEffect, useState } from "react";

const KEY = "hedge-theme-pref";

/** @typedef {"system" | "light" | "dark"} ThemePref */

function readStoredPref() {
  try {
    const s = localStorage.getItem(KEY);
    if (s === "light" || s === "dark" || s === "system") return s;
    if (s === null) return "system";
    return "system";
  } catch {
    return "system";
  }
}

function systemPrefersLight() {
  return window.matchMedia("(prefers-color-scheme: light)").matches;
}

/** @param {ThemePref} pref */
export function applyThemePref(pref) {
  const root = document.documentElement;
  const light = pref === "light" || (pref === "system" && systemPrefersLight());
  if (light) root.classList.add("light");
  else root.classList.remove("light");
}

/** @param {ThemePref} pref */
function persistPref(pref) {
  try {
    localStorage.setItem(KEY, pref);
  } catch {
    /* ignore */
  }
}

export function useTheme() {
  const [pref, setPref] = useState(/** @type {ThemePref} */ (readStoredPref));
  const [systemLight, setSystemLight] = useState(systemPrefersLight);

  const effectiveLight = pref === "light" || (pref === "system" && systemLight);

  useEffect(() => {
    applyThemePref(pref);
    persistPref(pref);
  }, [pref, systemLight]);

  useEffect(() => {
    if (pref !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = () => {
      setSystemLight(mq.matches);
      applyThemePref("system");
    };
    setSystemLight(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [pref]);

  const cycle = useCallback(() => {
    setPref((p) => (p === "system" ? "light" : p === "light" ? "dark" : "system"));
  }, []);

  const setPrefExplicit = useCallback((/** @type {ThemePref} */ next) => {
    setPref(next);
  }, []);

  return { pref, effectiveLight, cycle, setPref: setPrefExplicit };
}
