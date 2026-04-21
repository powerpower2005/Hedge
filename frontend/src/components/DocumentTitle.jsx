import { useEffect } from "react";
import { useI18n } from "../i18n/I18nContext.jsx";

export function DocumentTitle() {
  const { t, locale } = useI18n();
  useEffect(() => {
    document.title = t("app.documentTitle");
    document.documentElement.lang = locale === "en" ? "en" : "ko";
  }, [t, locale]);
  return null;
}
