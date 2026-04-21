import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DATA_URLS, IS_REPOSITORY_CONFIGURED } from "../../lib/constants";
import { useI18n } from "../../i18n/I18nContext.jsx";

export function Footer() {
  const { t } = useI18n();
  const [version, setVersion] = useState("");
  const [rules, setRules] = useState(null);

  useEffect(() => {
    if (!IS_REPOSITORY_CONFIGURED) return undefined;
    fetch(DATA_URLS.version)
      .then((r) => {
        if (!r.ok) return null;
        return r.text();
      })
      .then((text) => {
        if (text != null) setVersion(text.trim());
      })
      .catch(() => {});
    fetch(DATA_URLS.rules)
      .then((r) => {
        if (!r.ok) return null;
        return r.json();
      })
      .then((j) => {
        if (j != null) setRules(j);
      })
      .catch(() => {});
    return undefined;
  }, []);

  return (
    <footer className="mt-16 border-t border-zinc-800 py-6 text-xs text-zinc-500 light:border-zinc-200 light:text-zinc-600">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4">
        <div>
          {t("app.title")}
          {version && <span className="ml-2">v{version}</span>}
          {rules && <span className="ml-2">{t("footer.rulesLine", { version: rules.rules_version })}</span>}
        </div>
        <div className="flex gap-4">
          <Link to="/about" className="hover:text-zinc-300 light:hover:text-zinc-900">
            {t("footer.about")}
          </Link>
        </div>
      </div>
    </footer>
  );
}
