import { Link } from "react-router-dom";
import { useI18n } from "../../i18n/I18nContext.jsx";

export function AppLogo() {
  const { t } = useI18n();
  return (
    <Link to="/" className="inline-flex items-center gap-2 rounded-lg focus-visible:outline-none">
      <span
        className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600 text-white shadow-sm light:bg-primary-600"
        aria-hidden
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
          <path
            fillRule="evenodd"
            d="M14 3.5a1 1 0 0 1 1 1v9.5a1 1 0 1 1-2 0V6.914l-5.293 5.293a1 1 0 0 1-1.414-1.414l6.5-6.5a1 1 0 0 1 1.414 0l6.5 6.5a1 1 0 0 1-1.414 1.414L14 6.914V15.5a1 1 0 1 1-2 0V4.5a1 1 0 0 1 1-1h4Z"
            clipRule="evenodd"
          />
        </svg>
      </span>
      <span className="text-lg font-bold tracking-tight text-zinc-100 light:text-zinc-900">{t("app.title")}</span>
    </Link>
  );
}
