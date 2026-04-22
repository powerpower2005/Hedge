import { useDataCacheRevision } from "../context/DataCacheContext.jsx";
import { IS_REPOSITORY_CONFIGURED } from "../lib/constants";
import { getResolvedDataUrls } from "../lib/githubRawRoot.js";
import { useI18n } from "../i18n/I18nContext.jsx";
import { useEffect, useState } from "react";

export function AboutPage() {
  const { t } = useI18n();
  const dataRevision = useDataCacheRevision();
  const [rules, setRules] = useState(null);

  useEffect(() => {
    if (!IS_REPOSITORY_CONFIGURED) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const urls = await getResolvedDataUrls();
        if (cancelled) return;
        const r = await fetch(urls.rules, { cache: "no-store" });
        if (!cancelled && r.ok) setRules(await r.json());
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dataRevision]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold text-white light:text-zinc-900">{t("about.title")}</h1>
      <p className="mt-4 text-zinc-300 light:text-zinc-700">{t("about.lead")}</p>
      <ul className="mt-4 list-disc space-y-2 pl-5 text-zinc-300 light:text-zinc-700">
        <li>{t("about.bullet1")}</li>
        <li>{t("about.bullet2")}</li>
        <li>{t("about.bullet3")}</li>
      </ul>
      {rules && (
        <p className="mt-4 text-sm text-zinc-500">
          {t("about.rulesLoaded", { version: rules.rules_version, from: rules.effective_from })}
        </p>
      )}
    </div>
  );
}
