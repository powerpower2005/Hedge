import { useI18n } from "../../i18n/I18nContext.jsx";

export function LangToggle() {
  const { locale, setLocale, t } = useI18n();
  return (
    <div className="flex items-center gap-1 rounded-md border border-zinc-700 px-1 py-0.5 light:border-zinc-300">
      <span className="sr-only">{t("lang.label")}</span>
      <button
        type="button"
        onClick={() => setLocale("ko")}
        className={`rounded px-2 py-0.5 text-xs ${
          locale === "ko"
            ? "bg-zinc-700 text-white light:bg-zinc-200 light:text-zinc-900"
            : "text-zinc-400 hover:text-white light:text-zinc-600 light:hover:text-zinc-900"
        }`}
      >
        {t("lang.ko")}
      </button>
      <button
        type="button"
        onClick={() => setLocale("en")}
        className={`rounded px-2 py-0.5 text-xs ${
          locale === "en"
            ? "bg-zinc-700 text-white light:bg-zinc-200 light:text-zinc-900"
            : "text-zinc-400 hover:text-white light:text-zinc-600 light:hover:text-zinc-900"
        }`}
      >
        {t("lang.en")}
      </button>
    </div>
  );
}
