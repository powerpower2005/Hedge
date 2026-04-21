import { useI18n } from "../i18n/I18nContext.jsx";

export function GuidePage() {
  const { t } = useI18n();
  const steps = [1, 2, 3, 4, 5, 6];
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold text-white light:text-zinc-900">{t("guide.title")}</h1>
      <p className="mt-4 text-zinc-300 light:text-zinc-700">{t("guide.lead")}</p>
      <ol className="mt-8 list-decimal space-y-8 pl-5 text-zinc-300 light:text-zinc-700">
        {steps.map((n) => (
          <li key={n} className="pl-1">
            <h2 className="text-lg font-semibold text-white light:text-zinc-900">
              {t(`guide.s${n}Title`)}
            </h2>
            <p className="mt-2 text-sm leading-relaxed">{t(`guide.s${n}Body`)}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
