import { useI18n } from "../i18n/I18nContext.jsx";
import { type } from "../lib/typographyClasses.js";
import { ui } from "../lib/themeClasses.js";

export function GuidePage() {
  const { t } = useI18n();
  const steps = [1, 2, 3, 4, 5, 6];
  return (
    <article className={`${ui.page} max-w-3xl`}>
      <h1 className={type.pageTitle}>{t("guide.title")}</h1>
      <p className={`mt-3 mb-10 max-w-prose ${type.pageLead}`}>{t("guide.lead")}</p>
      <ol className="list-decimal space-y-10 pl-5 marker:font-bold marker:text-zinc-500 light:marker:text-zinc-500">
        {steps.map((n) => (
          <li key={n} className="pl-2">
            <h2 className={type.cardTitle}>{t(`guide.s${n}Title`)}</h2>
            <p className={`mt-3 max-w-prose ${type.pageLead}`}>{t(`guide.s${n}Body`)}</p>
          </li>
        ))}
      </ol>
    </article>
  );
}
