import { useEffect } from "react";
import { useI18n } from "../../i18n/I18nContext.jsx";
import { ui } from "../../lib/themeClasses.js";
import { MARKET_INDICES, TV_MINI_CHART_SCRIPT } from "../../lib/marketIndices.js";

function useMiniChartScript() {
  useEffect(() => {
    if (document.querySelector(`script[src="${TV_MINI_CHART_SCRIPT}"]`)) return;
    const script = document.createElement("script");
    script.type = "module";
    script.src = TV_MINI_CHART_SCRIPT;
    document.head.appendChild(script);
  }, []);
}

/**
 * Single mini-chart card. The widget follows the page color-scheme automatically
 * (no `theme` attribute), so dark/light toggling needs no remount.
 */
function MiniChartCard({ symbol, label, timeFrame, className = "" }) {
  return (
    <div className={`${ui.card} overflow-hidden p-2 ${className}`}>
      <p className={`px-2 pb-1.5 ${ui.label}`}>{label}</p>
      <div className="h-36">
        <tv-mini-chart
          symbol={symbol}
          line-chart-type="Baseline"
          show-time-scale=""
          {...(timeFrame ? { "time-frame": timeFrame } : {})}
          style={{ display: "block", width: "100%", height: "100%" }}
        />
      </div>
    </div>
  );
}

/** Desktop right rail: vertical stack, visible at lg+. */
export function MarketIndexRail({ onCollapse }) {
  const { t } = useI18n();
  useMiniChartScript();
  return (
    <aside className="hidden lg:block xl:sticky xl:top-24 xl:self-start" aria-label={t("market.title")}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className={ui.sectionTitle}>{t("market.title")}</h2>
        {onCollapse ? (
          <button
            type="button"
            onClick={onCollapse}
            className="shrink-0 rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200 light:hover:bg-zinc-100 light:hover:text-zinc-800"
            aria-label={t("market.hide")}
            title={t("market.hide")}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5" aria-hidden>
              <path
                fillRule="evenodd"
                d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 1 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        ) : null}
      </div>
      <div className="flex flex-col gap-3">
        {MARKET_INDICES.map((idx) => (
          <MiniChartCard key={idx.symbol} symbol={idx.symbol} label={t(idx.labelKey)} timeFrame={idx.timeFrame} />
        ))}
      </div>
    </aside>
  );
}

/** Tab on the right edge when the desktop rail is collapsed. */
export function MarketSidebarReveal({ onOpen }) {
  const { t } = useI18n();
  return (
    <button
      type="button"
      onClick={onOpen}
      className="fixed right-0 top-1/2 z-30 hidden -translate-y-1/2 flex-col items-center gap-1 rounded-l-xl border-2 border-r-0 border-zinc-600 bg-zinc-900/95 px-2 py-3 text-xs font-semibold text-zinc-300 shadow-lg backdrop-blur transition hover:bg-zinc-800 hover:text-white light:border-zinc-300 light:bg-white/95 light:text-zinc-700 light:hover:bg-zinc-50 lg:flex"
      aria-label={t("market.show")}
      title={t("market.show")}
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden>
        <path
          fillRule="evenodd"
          d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z"
          clipRule="evenodd"
        />
      </svg>
      <span className="max-w-[4.5rem] text-center leading-tight [writing-mode:vertical-rl]">{t("market.title")}</span>
    </button>
  );
}

/** Mobile/tablet strip: horizontal scroll, hidden at lg+. */
export function MarketIndexStrip() {
  const { t } = useI18n();
  useMiniChartScript();
  return (
    <section className="lg:hidden" aria-label={t("market.title")}>
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h2 className={ui.sectionTitle}>{t("market.title")}</h2>
        <span className={ui.label}>{t("market.scrollHint")}</span>
      </div>
      <div className="-mx-3 flex snap-x snap-mandatory gap-3 overflow-x-auto px-3 pb-2 sm:-mx-4 sm:px-4">
        {MARKET_INDICES.map((idx) => (
          <MiniChartCard
            key={idx.symbol}
            symbol={idx.symbol}
            label={t(idx.labelKey)}
            timeFrame={idx.timeFrame}
            className="w-60 shrink-0 snap-start"
          />
        ))}
      </div>
    </section>
  );
}
