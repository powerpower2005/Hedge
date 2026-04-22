import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDataCacheRevision } from "../../context/DataCacheContext.jsx";
import { IS_REPOSITORY_CONFIGURED } from "../../lib/constants";
import { getResolvedDataUrls } from "../../lib/githubRawRoot.js";
import { useI18n } from "../../i18n/I18nContext.jsx";

export function Footer() {
  const { t } = useI18n();
  const dataRevision = useDataCacheRevision();
  const [version, setVersion] = useState("");
  const [rules, setRules] = useState(null);

  useEffect(() => {
    if (!IS_REPOSITORY_CONFIGURED) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const urls = await getResolvedDataUrls();
        if (cancelled) return;
        const [vr, rr] = await Promise.all([
          fetch(urls.version, { cache: "no-store" }).then((r) => (r.ok ? r.text() : null)),
          fetch(urls.rules, { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)),
        ]);
        if (cancelled) return;
        if (vr != null) setVersion(vr.trim());
        if (rr != null) setRules(rr);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dataRevision]);

  return (
    <footer className="mt-16 border-t border-zinc-800 py-6 text-xs text-zinc-500 light:border-zinc-200 light:text-zinc-600">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4">
        <div>
          {t("app.title")}
          {version && <span className="ml-2">v{version}</span>}
          {rules && <span className="ml-2">{t("footer.rulesLine", { version: rules.rules_version })}</span>}
        </div>
        <div className="flex gap-4">
          <Link to="/guide" className="hover:text-zinc-300 light:hover:text-zinc-900">
            {t("footer.guide")}
          </Link>
          <Link to="/about" className="hover:text-zinc-300 light:hover:text-zinc-900">
            {t("footer.about")}
          </Link>
        </div>
      </div>
    </footer>
  );
}
