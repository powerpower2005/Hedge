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
      <p className={`px-1 pb-1 ${ui.label}`}>{label}</p>
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
export function MarketIndexRail() {
  const { t } = useI18n();
  useMiniChartScript();
  return (
    <aside className="hidden lg:block" aria-label={t("market.title")}>
      <h2 className={`mb-3 ${ui.sectionTitle}`}>{t("market.title")}</h2>
      <div className="flex flex-col gap-3">
        {MARKET_INDICES.map((idx) => (
          <MiniChartCard key={idx.symbol} symbol={idx.symbol} label={t(idx.labelKey)} timeFrame={idx.timeFrame} />
        ))}
      </div>
    </aside>
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
