import en from "../i18n/locales/en.js";
import ko from "../i18n/locales/ko.js";

const STEP_IDS = [1, 2, 3, 4, 5, 6];

/**
 * @param {"ko" | "en"} locale
 */
export function getGuideSteps(locale) {
  const guide = locale === "en" ? en.guide : ko.guide;
  return STEP_IDS.map((n) => {
    const paragraphs = guide[`s${n}Paragraphs`];
    const fallback = guide[`s${n}Body`];
    return {
      n,
      title: guide[`s${n}Title`],
      paragraphs: Array.isArray(paragraphs) ? paragraphs : fallback ? [fallback] : [],
    };
  });
}
