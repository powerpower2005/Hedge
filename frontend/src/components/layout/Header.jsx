import { Link, NavLink } from "react-router-dom";
import { useInvalidateDataCaches } from "../../context/DataCacheContext.jsx";
import { IS_REPOSITORY_CONFIGURED, NEW_PICK_URL } from "../../lib/constants";
import { useI18n } from "../../i18n/I18nContext.jsx";
import { LangToggle } from "./LangToggle.jsx";
import { ThemeToggle } from "./ThemeToggle.jsx";

const linkClass = ({ isActive }) =>
  `px-3 py-2 rounded-md text-sm font-medium ${
    isActive
      ? "bg-zinc-800 text-white light:bg-zinc-200 light:text-zinc-900"
      : "text-zinc-400 hover:text-white light:text-zinc-600 light:hover:text-zinc-900"
  }`;

export function Header() {
  const { t } = useI18n();
  const invalidateDataCaches = useInvalidateDataCaches();
  return (
    <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur light:border-zinc-200 light:bg-white/80">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="text-lg font-semibold tracking-tight text-white light:text-zinc-900">
          {t("app.title")}
        </Link>
        <nav className="flex flex-wrap items-center gap-1">
          <NavLink to="/" end className={linkClass}>
            {t("nav.active")}
          </NavLink>
          <NavLink to="/hall-of-fame" className={linkClass}>
            {t("nav.hallOfFame")}
          </NavLink>
          <NavLink to="/expired" className={linkClass}>
            {t("nav.expired")}
          </NavLink>
          <NavLink to="/users" className={linkClass}>
            {t("nav.users")}
          </NavLink>
          <NavLink to="/about" className={linkClass}>
            {t("nav.about")}
          </NavLink>
          <NavLink to="/guide" className={linkClass}>
            {t("nav.guide")}
          </NavLink>
          <LangToggle />
          <ThemeToggle />
          {IS_REPOSITORY_CONFIGURED && (
            <>
              <button
                type="button"
                className="rounded-md border border-zinc-600 px-3 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-800 light:border-zinc-300 light:text-zinc-800 light:hover:bg-zinc-100"
                title={t("nav.refreshDataTitle")}
                aria-label={t("nav.refreshDataTitle")}
                onClick={() => invalidateDataCaches()}
              >
                {t("nav.refreshData")}
              </button>
              <a
                href={NEW_PICK_URL}
                className="ml-2 rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500"
              >
                {t("nav.newPick")}
              </a>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
