import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useInvalidateDataCaches } from "../../context/DataCacheContext.jsx";
import { useRepoMeta } from "../../hooks/useRepoMeta.js";
import { IS_REPOSITORY_CONFIGURED, NEW_PICK_URL } from "../../lib/constants";
import { formatJudgmentUtc } from "../../lib/formatters.js";
import { hasSeenQuickGuide, markQuickGuideSeen } from "../../lib/onboarding.js";
import { useI18n } from "../../i18n/I18nContext.jsx";
import { ui } from "../../lib/themeClasses.js";
import { type } from "../../lib/typographyClasses.js";
import { AppLogo } from "./AppLogo.jsx";
import { PrimaryNav } from "./PrimaryNav.jsx";
import { LangToggle } from "./LangToggle.jsx";
import { ThemeToggle } from "./ThemeToggle.jsx";

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
    { icon: "5", title: t("guide.s5Title"), body: t("guide.quickS5") },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 px-4 pt-16 sm:pt-20"
      role="presentation"
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-guide-title"
        className={`mx-auto w-full max-w-lg p-6 sm:p-7 ${ui.dialog}`}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h3 id="quick-guide-title" className={type.tutorialTitle}>
            {t("guide.quickTagline")}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("guide.dismiss")}
            className="shrink-0 rounded-md p-1.5 text-zinc-400 hover:bg-zinc-800 light:hover:bg-zinc-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-6 w-6">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>
        <p className={`mb-3 ${type.tutorialSubtitle}`}>{t("guide.title")}</p>
        <div className="mb-5 rounded-xl border-2 border-primary-600/60 bg-zinc-800 p-4 light:border-primary-400 light:bg-primary-50">
          <p className={type.tutorialStepTitle}>{t("guide.s1Title")}</p>
          <p className={`mt-2 ${type.tutorialBody}`}>{t("guide.quickS1")}</p>
        </div>
        <ol className="space-y-4">
          {moreSteps.map((s) => (
            <li key={s.icon} className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-zinc-600 text-xs font-bold text-zinc-400 light:border-zinc-300 light:text-zinc-600">
                {s.icon}
              </span>
              <span className="min-w-0">
                <span className={`block ${type.tutorialStepTitle}`}>{s.title}</span>
                <span className={`mt-1 block ${type.tutorialBody}`}>{s.body}</span>
              </span>
            </li>
          ))}
        </ol>
        {firstVisit ? <p className={`mt-5 ${type.tutorialNote}`}>{t("guide.firstVisitWelcome")}</p> : null}
        <button type="button" onClick={onClose} className={`mt-5 w-full ${ui.btnPrimaryLg}`}>
          {t("guide.dismiss")}
        </button>
        <button
          type="button"
          onClick={() => {
            onClose();
            navigate("/guide");
          }}
          className={`mt-3 w-full ${ui.btnSecondaryLg}`}
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

  const judgmentLabel = lastDailyJudgmentAt ? formatJudgmentUtc(lastDailyJudgmentAt, locale) : "";

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-zinc-950/95 backdrop-blur light:border-zinc-200 light:bg-white/95">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-3 py-3 sm:gap-3 sm:px-4 lg:flex-row lg:items-center lg:gap-4">
          <div className="flex shrink-0 items-center justify-between gap-2 lg:justify-start">
            <AppLogo />
            {IS_REPOSITORY_CONFIGURED ? (
              <a href={NEW_PICK_URL} className={`${ui.btnPrimary} text-sm lg:hidden`}>
                <span aria-hidden>+</span> {t("nav.newPick")}
              </a>
            ) : null}
          </div>

          <PrimaryNav />

          <div
            className="flex shrink-0 flex-wrap items-center gap-2 lg:justify-end"
            role="toolbar"
            aria-label={t("nav.utilities")}
          >
            <LangToggle />
            <ThemeToggle />
            {IS_REPOSITORY_CONFIGURED && (
              <>
                <button
                  type="button"
                  className="rounded-xl p-2 text-zinc-400 hover:bg-zinc-800 light:hover:bg-zinc-100"
                  title={t("nav.refreshDataTitle")}
                  aria-label={t("nav.refreshData")}
                  onClick={() => invalidateDataCaches()}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                    <path
                      fillRule="evenodd"
                      d="M15.312 11.424a5.5 5.5 0 0 1-9.201 2.466l-.312-.311h2.451a.75.75 0 0 0 0-1.5H4.5a.75.75 0 0 0-.75.75v3.75a.75.75 0 0 0 1.5 0v-2.033a7 7 0 0 0 11.712-3.138.75.75 0 0 0-1.449-.39l-.201.406Zm-1.024-7.26a.75.75 0 0 0-1.5 0v2.034A7 7 0 0 0 1.076 9.336a.75.75 0 0 0 1.449.39l.2-.406a5.5 5.5 0 0 1 9.2-2.467l.313.311H9.787a.75.75 0 0 0 0 1.5H13.5a.75.75 0 0 0 .75-.75v-3.75l.038-.22Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
                <button
                  type="button"
                  className="rounded-xl p-2 text-zinc-400 hover:bg-zinc-800 light:hover:bg-zinc-100"
                  title={t("guide.lead")}
                  aria-label={t("guide.title")}
                  onClick={() => setShowGuide(true)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0ZM10 7a1 1 0 0 0-.868.504.75.75 0 0 1-1.3-.748A2.5 2.5 0 0 1 12.5 8c0 1.074-.832 1.678-1.394 2.046l-.088.057C10.476 10.44 10 10.778 10 11.375a.75.75 0 0 1-1.5 0c0-1.344.866-1.946 1.447-2.324l.07-.045C10.549 8.658 11 8.386 11 8a1 1 0 0 0-1-1Zm0 7.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
                <a href={NEW_PICK_URL} className={`${ui.btnPrimary} hidden lg:inline-flex`}>
                  <span aria-hidden>+</span> {t("nav.newPick")}
                </a>
              </>
            )}
          </div>
        </div>

        {IS_REPOSITORY_CONFIGURED && judgmentLabel ? (
          <p className="border-t border-zinc-800 bg-zinc-900/80 px-4 py-2 text-center text-xs font-medium text-zinc-300 light:border-zinc-200 light:bg-primary-50 light:text-primary-900">
            {t("nav.lastJudgment", { time: judgmentLabel })}
          </p>
        ) : null}
      </header>
      {showGuide ? <QuickGuideCard onClose={dismissGuide} firstVisit={guideFirstVisit} /> : null}
    </>
  );
}
