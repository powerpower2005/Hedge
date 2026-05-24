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
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="none"
          className="h-5 w-5"
          aria-hidden
        >
          {/* baseline */}
          <path
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            d="M3 15.5h14"
          />
          {/* rising close line (stock chart) */}
          <path
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 12.5 7.5 10 11 11.5 16 6"
          />
          <circle cx="16" cy="6" r="1.25" fill="currentColor" />
        </svg>
      </span>
      <span className="text-lg font-bold tracking-tight text-zinc-100 light:text-zinc-900">{t("app.title")}</span>
    </Link>
  );
}
