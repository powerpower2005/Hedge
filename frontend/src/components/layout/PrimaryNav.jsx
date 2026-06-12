import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const children = entry.children ?? [];
  const isOpen = openId === entry.id;
  const isActive = isNavGroupActive(pathname, children);
  const [menuPos, setMenuPos] = useState(null);

  const close = useCallback(() => setOpenId(null), [setOpenId]);

  const updateMenuPos = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setMenuPos({
      top: rect.bottom + 4,
      left: rect.left,
      minWidth: Math.max(rect.width, 192),
    });
  }, []);

  const toggle = useCallback(
    (e) => {
      e.stopPropagation();
      setOpenId((prev) => (prev === entry.id ? null : entry.id));
    },
    [entry.id, setOpenId],
  );

  useEffect(() => {
    if (!isOpen) {
      setMenuPos(null);
      return;
    }
    updateMenuPos();
    window.addEventListener("resize", updateMenuPos);
    window.addEventListener("scroll", updateMenuPos, true);
    return () => {
      window.removeEventListener("resize", updateMenuPos);
      window.removeEventListener("scroll", updateMenuPos, true);
    };
  }, [isOpen, updateMenuPos]);

  useEffect(() => {
    if (!isOpen) return;
    function onDocumentClick(e) {
      const target = e.target;
      if (!(target instanceof Node)) return;
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      close();
    }
    function onKey(e) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("click", onDocumentClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onDocumentClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [isOpen, close]);

  const menuPanel =
    isOpen && menuPos
      ? createPortal(
          <div
            ref={menuRef}
            id={menuId}
            role="menu"
            aria-labelledby={`nav-trigger-${entry.id}`}
            style={{
              position: "fixed",
              top: menuPos.top,
              left: menuPos.left,
              minWidth: menuPos.minWidth,
            }}
            className="z-[100] overflow-hidden rounded-xl border-2 border-zinc-600 bg-zinc-900 py-1 shadow-xl light:border-zinc-300 light:bg-white"
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
          </div>,
          document.body,
        )
      : null;

  return (
    <div className="relative shrink-0">
      <button
        ref={triggerRef}
        type="button"
        id={`nav-trigger-${entry.id}`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={isOpen ? menuId : undefined}
        className={ui.navTab(isActive || isOpen)}
        onClick={toggle}
      >
        <span className="inline-flex items-center justify-center gap-1">
          {t(entry.labelKey)}
          <Chevron open={isOpen} />
        </span>
      </button>
      {menuPanel}
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
    <nav
      className="relative z-50 flex min-w-0 flex-1 justify-center overflow-visible lg:justify-start"
      aria-label={t("nav.primary")}
    >
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
