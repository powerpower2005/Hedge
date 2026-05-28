import { useCallback, useEffect, useId, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useI18n } from "../../i18n/I18nContext.jsx";
import {
  isNavGroupActive,
  isRankingSectionActive,
  pathnameMatchesLeaf,
  PRIMARY_NAV,
} from "../../lib/navConfig.js";
import { ui } from "../../lib/themeClasses.js";

function Chevron({ open }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={`h-4 w-4 shrink-0 opacity-70 transition ${open ? "rotate-180" : ""}`}
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function NavDropdown({ entry, pathname, openId, setOpenId }) {
  const { t } = useI18n();
  const menuId = useId();
  const rootRef = useRef(null);
  const children = entry.children ?? [];
  const isOpen = openId === entry.id;
  const isActive = isNavGroupActive(pathname, children);

  const close = useCallback(() => setOpenId(null), [setOpenId]);
  const toggle = useCallback(() => {
    setOpenId((prev) => (prev === entry.id ? null : entry.id));
  }, [entry.id, setOpenId]);

  useEffect(() => {
    if (!isOpen) return;
    function onPointerDown(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) close();
    }
    function onKey(e) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [isOpen, close]);

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        id={`nav-trigger-${entry.id}`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={menuId}
        className={ui.navTab(isActive || isOpen)}
        onClick={toggle}
      >
        <span className="inline-flex items-center justify-center gap-1">
          {t(entry.labelKey)}
          <Chevron open={isOpen} />
        </span>
      </button>
      {isOpen ? (
        <div
          id={menuId}
          role="menu"
          aria-labelledby={`nav-trigger-${entry.id}`}
          className="absolute left-0 top-full z-50 mt-1 min-w-[12rem] overflow-hidden rounded-xl border-2 border-zinc-600 bg-zinc-900 py-1 shadow-lg light:border-zinc-300 light:bg-white"
        >
          {children.map((leaf) => (
            <NavLink
              key={leaf.to}
              to={leaf.to}
              end={leaf.end}
              role="menuitem"
              className={({ isActive: leafActive }) => ui.navDropdownItem(leafActive)}
              onClick={close}
            >
              {t(leaf.labelKey)}
            </NavLink>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function PrimaryNav() {
  const { t } = useI18n();
  const { pathname } = useLocation();
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    setOpenId(null);
  }, [pathname]);

  return (
    <nav className="min-w-0 flex-1" aria-label={t("nav.primary")}>
      <div className={`${ui.navGroup} w-fit max-w-full`}>
        {PRIMARY_NAV.map((entry) => {
          if (entry.children) {
            return (
              <NavDropdown
                key={entry.id}
                entry={entry}
                pathname={pathname}
                openId={openId}
                setOpenId={setOpenId}
              />
            );
          }
          const leafActive =
            entry.id === "ranking"
              ? isRankingSectionActive(pathname)
              : pathnameMatchesLeaf(pathname, entry);
          return (
            <NavLink
              key={entry.id}
              to={entry.to}
              end={entry.end}
              className={ui.navTab(leafActive)}
            >
              {t(entry.labelKey)}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
