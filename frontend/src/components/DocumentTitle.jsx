import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useI18n } from "../i18n/I18nContext.jsx";

export function DocumentTitle() {
  const { t, locale } = useI18n();
  const { pathname } = useLocation();

  useEffect(() => {
    let key = "app.documentTitle";
    if (pathname === "/about") key = "about.documentTitle";
    else if (pathname === "/guide") key = "guide.documentTitle";
    document.title = t(key);
    document.documentElement.lang = locale === "en" ? "en" : "ko";
  }, [t, locale, pathname]);

  return null;
}
