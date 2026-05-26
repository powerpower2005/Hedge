import { useEffect, useState } from "react";
import { useI18n } from "../../i18n/I18nContext.jsx";
import { ui } from "../../lib/themeClasses.js";

const SHOW_AFTER_PX = 320;

export function ScrollToTop() {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > SHOW_AFTER_PX);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      className={`fixed bottom-5 right-4 z-50 flex h-11 w-11 items-center justify-center rounded-full shadow-lg sm:bottom-6 sm:right-6 ${ui.btnPrimary}`}
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label={t("common.scrollToTop")}
      title={t("common.scrollToTop")}
    >
      <span className="text-lg leading-none" aria-hidden>
        ↑
      </span>
    </button>
  );
}
