import { useI18n } from "../../i18n/I18nContext.jsx";

/**
 * Centered loading indicator for full-page / tab transitions.
 * @param {{ className?: string }} props
 */
export function PageLoading({ className = "" }) {
  const { t } = useI18n();
  return (
    <div
      className={`flex min-h-[min(50vh,20rem)] w-full items-center justify-center px-4 py-16 ${className}`.trim()}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="sr-only">{t("common.loading")}</span>
      <span
        className="h-10 w-10 animate-spin rounded-full border-2 border-zinc-600 border-t-primary-500 light:border-zinc-300 light:border-t-primary-600"
        aria-hidden
      />
    </div>
  );
}
