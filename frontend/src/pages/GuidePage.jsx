import { GuideSectionBody } from "../components/guide/GuideSectionBody.jsx";
import { useI18n } from "../i18n/I18nContext.jsx";
import { getGuideSteps } from "../lib/guideParagraphs.js";
import { type } from "../lib/typographyClasses.js";
import { ui } from "../lib/themeClasses.js";

export function GuidePage() {
  const { t, locale } = useI18n();
  const steps = getGuideSteps(locale);

  return (
    <article className={`${ui.page} max-w-3xl`}>
      <header className={`${ui.card} ${ui.cardPad}`}>
        <h1 className={type.pageTitle}>{t("guide.title")}</h1>
        <p className={`mt-3 max-w-prose text-sm leading-relaxed text-zinc-300 light:text-zinc-700`}>
          {t("guide.lead")}
        </p>
      </header>

      <ol className="mt-8 list-none space-y-6 p-0">
        {steps.map((step) => (
          <li key={step.n}>
            <section className={`${ui.card} ${ui.cardPad}`}>
              <div className="flex items-start gap-3">
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-600/20 text-sm font-bold text-primary-300 light:bg-primary-100 light:text-primary-800"
                  aria-hidden
                >
                  {step.n}
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className={type.cardTitle}>{step.title}</h2>
                  <GuideSectionBody paragraphs={step.paragraphs} />
                </div>
              </div>
            </section>
          </li>
        ))}
      </ol>
    </article>
  );
}
