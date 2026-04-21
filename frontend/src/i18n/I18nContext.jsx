import { createContext, useCallback, useContext, useMemo, useState } from "react";
import en from "./locales/en.js";
import ko from "./locales/ko.js";

const STORAGE_KEY = "hedge-lang";

const dicts = { ko, en };

function getByPath(obj, path) {
  return path.split(".").reduce((o, k) => (o != null && typeof o === "object" ? o[k] : undefined), obj);
}

const I18nContext = createContext({
  locale: "ko",
  setLocale: () => {},
  t: (key, vars) => key,
});

export function I18nProvider({ children }) {
  const [locale, setLocaleState] = useState(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      return s === "en" ? "en" : "ko";
    } catch {
      return "ko";
    }
  });

  const setLocale = useCallback((next) => {
    const l = next === "en" ? "en" : "ko";
    setLocaleState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* ignore */
    }
  }, []);

  const t = useCallback(
    (key, vars) => {
      const raw = getByPath(dicts[locale], key) ?? getByPath(dicts.ko, key) ?? key;
      if (typeof raw !== "string") return key;
      if (!vars) return raw;
      return raw.replace(/\{(\w+)\}/g, (_, k) => (vars[k] != null ? String(vars[k]) : `{${k}}`));
    },
    [locale],
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
