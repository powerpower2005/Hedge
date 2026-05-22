import { useState, useRef, useEffect, useCallback } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useInvalidateDataCaches } from "../../context/DataCacheContext.jsx";
import { useRepoMeta } from "../../hooks/useRepoMeta.js";
import { IS_REPOSITORY_CONFIGURED, NEW_PICK_URL } from "../../lib/constants";
import { formatJudgmentUtc } from "../../lib/formatters.js";
import { hasSeenQuickGuide, markQuickGuideSeen } from "../../lib/onboarding.js";
import { useI18n } from "../../i18n/I18nContext.jsx";
import { type } from "../../lib/typographyClasses.js";
import { LangToggle } from "./LangToggle.jsx";
import { ThemeToggle } from "./ThemeToggle.jsx";

const linkClass = ({ isActive }) =>
  `px-3 py-2 rounded-md text-base font-semibold whitespace-nowrap ${
    isActive
      ? "bg-zinc-800 text-white light:bg-zinc-200 light:text-zinc-900"
      : "text-zinc-400 hover:text-white light:text-zinc-600 light:hover:text-zinc-900"
  }`;

function QuickGuideCard({ onClose, firstVisit }) {
  const { t } = useI18n();
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    function handleEsc(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [onClose]);

  const moreSteps = [
    { icon: "2", title: t("guide.s2Title"), body: t("guide.quickS2") },
    { icon: "3", title: t("guide.s3Title"), body: t("guide.quickS3") },
    { icon: "4", title: t("guide.s4Title"), body: t("guide.quickS4") },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-20"
      role="presentation"
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-guide-title"
        className="mx-4 w-full max-w-md rounded-xl border border-zinc-700 bg-zinc-900 p-5 shadow-2xl light:border-zinc-200 light:bg-white"
      >
        <div className="mb-3 flex items-start justify-between gap-2">
          <h3
            id="quick-guide-title"
            className="text-base font-semibold leading-snug text-zinc-100 light:text-zinc-900"
          >
            {t("guide.quickTagline")}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("guide.dismiss")}
            className="shrink-0 rounded-md p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white light:hover:bg-zinc-100 light:hover:text-zinc-900"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>
        <p className={`mb-1 ${type.metaSm}`}>{t("guide.title")}</p>

        <div className="mb-4 rounded-lg border border-zinc-600 bg-zinc-800/60 p-3 light:border-zinc-300 light:bg-zinc-100">
          <p className={type.stepTitle}>{t("guide.s1Title")}</p>
          <p className={`mt-1.5 ${type.body}`}>{t("guide.quickS1")}</p>
        </div>

        <ol className="space-y-2.5">
          {moreSteps.map((s) => (
            <li key={s.icon} className="flex gap-2.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-zinc-700 text-[10px] font-semibold text-zinc-500 light:border-zinc-300 light:text-zinc-500">
                {s.icon}
              </span>
              <span className="min-w-0">
                <span className={`${type.stepTitle} font-semibold text-zinc-400 light:text-zinc-500`}>{s.title}</span>
                <span className={`mt-0.5 block ${type.metaSm}`}>{s.body}</span>
              </span>
            </li>
          ))}
        </ol>

        {firstVisit ? (
          <p className={`mt-4 ${type.metaSm}`}>{t("guide.firstVisitWelcome")}</p>
        ) : null}

        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500"
        >
          {t("guide.dismiss")}
        </button>
        <button
          type="button"
          onClick={() => {
            onClose();
            navigate("/guide");
          }}
          className="mt-2 w-full rounded-lg border border-zinc-600 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800 light:border-zinc-300 light:text-zinc-700 light:hover:bg-zinc-100"
        >
          {t("guide.fullGuideCta")}
        </button>
      </div>
    </div>
  );
}

export function Header() {
  const { t, locale } = useI18n();
  const invalidateDataCaches = useInvalidateDataCaches();
  const { lastDailyJudgmentAt } = useRepoMeta();
  const [showGuide, setShowGuide] = useState(false);
  const [guideFirstVisit, setGuideFirstVisit] = useState(false);

  const dismissGuide = useCallback(() => {
    markQuickGuideSeen();
    setShowGuide(false);
    setGuideFirstVisit(false);
  }, []);

  useEffect(() => {
    if (!hasSeenQuickGuide()) {
      setGuideFirstVisit(true);
      setShowGuide(true);
    }
  }, []);

  const judgmentLabel = lastDailyJudgmentAt
    ? formatJudgmentUtc(lastDailyJudgmentAt, locale)
    : "";
  return (
    <>
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur light:border-zinc-200 light:bg-white/80">
        <div className="mx-auto max-w-6xl px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <Link to="/" className="text-lg font-semibold tracking-tight text-white light:text-zinc-900">
              {t("app.title")}
            </Link>
            {IS_REPOSITORY_CONFIGURED && (
              <a
                href={NEW_PICK_URL}
                className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500 sm:hidden"
              >
                {t("nav.newPick")}
              </a>
            )}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-1">
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
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-1">
            <LangToggle />
            <ThemeToggle />

            {IS_REPOSITORY_CONFIGURED && (
              <>
                <button
                  type="button"
                  className="rounded-md p-2 text-zinc-300 hover:bg-zinc-800 light:text-zinc-600 light:hover:bg-zinc-100"
                  title={t("nav.refreshDataTitle")}
                  aria-label={t("nav.refreshData")}
                  onClick={() => invalidateDataCaches()}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                    <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 0 1-9.201 2.466l-.312-.311h2.451a.75.75 0 0 0 0-1.5H4.5a.75.75 0 0 0-.75.75v3.75a.75.75 0 0 0 1.5 0v-2.033a7 7 0 0 0 11.712-3.138.75.75 0 0 0-1.449-.39l-.201.406Zm-1.024-7.26a.75.75 0 0 0-1.5 0v2.034A7 7 0 0 0 1.076 9.336a.75.75 0 0 0 1.449.39l.2-.406a5.5 5.5 0 0 1 9.2-2.467l.313.311H9.787a.75.75 0 0 0 0 1.5H13.5a.75.75 0 0 0 .75-.75v-3.75l.038-.22Z" clipRule="evenodd" />
                  </svg>
                </button>

                <button
                  type="button"
                  className="rounded-md p-2 text-zinc-300 hover:bg-zinc-800 light:text-zinc-600 light:hover:bg-zinc-100"
                  title={t("guide.lead")}
                  aria-label={t("guide.title")}
                  onClick={() => setShowGuide(true)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                    <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0ZM10 7a1 1 0 0 0-.868.504.75.75 0 0 1-1.3-.748A2.5 2.5 0 0 1 12.5 8c0 1.074-.832 1.678-1.394 2.046l-.088.057C10.476 10.44 10 10.778 10 11.375a.75.75 0 0 1-1.5 0c0-1.344.866-1.946 1.447-2.324l.07-.045C10.549 8.658 11 8.386 11 8a1 1 0 0 0-1-1Zm0 7.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd" />
                  </svg>
                </button>

                <a
                  href={NEW_PICK_URL}
                  className="ml-2 hidden rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500 sm:inline-flex"
                >
                  {t("nav.newPick")}
                </a>
              </>
            )}
          </div>
        </div>

        {IS_REPOSITORY_CONFIGURED && judgmentLabel ? (
          <p className="mx-auto mb-2 max-w-6xl border-y border-lime-700 bg-lime-300 px-4 py-3 text-xs font-bold text-zinc-900 shadow-[0_0_14px_rgba(163,230,53,0.7)] light:border-lime-700 light:bg-lime-300 light:text-zinc-900">
            <span className="inline-block">
              {t("nav.lastJudgment", { time: judgmentLabel })}
            </span>
          </p>
        ) : null}
      </header>
      {showGuide ? <QuickGuideCard onClose={dismissGuide} firstVisit={guideFirstVisit} /> : null}
    </>
  );
}
