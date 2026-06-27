import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ColorType, createChart, CrosshairMode } from "lightweight-charts";
import { useTheme } from "../../hooks/useTheme.js";
import { useI18n } from "../../i18n/I18nContext.jsx";
import { fetchJsonAllow404 } from "../../lib/fetchJson.js";
import {
  DETAIL_TRADING_BARS,
  filterChartBars,
  filterDetailTradingBars,
} from "../../lib/chartBars.js";
import {
  instrumentBarsUrl,
  isBarsChartJpDeferred,
  isBarsChartSupported,
} from "../../lib/barsUrl.js";
import { ui } from "../../lib/themeClasses.js";
import { type } from "../../lib/typographyClasses.js";
import { isEntryPending } from "../../lib/pickEntry.js";

function chartColors(light) {
  if (light) {
    return {
      background: "#ffffff",
      text: "#52525b",
      grid: "#e4e4e7",
      border: "#d4d4d8",
      up: "#2FA084",
      down: "#ef4444",
      entry: "#2563eb",
      target: "#9333ea",
    };
  }
  return {
    background: "#18181b",
    text: "#a1a1aa",
    grid: "#27272a",
    border: "#3f3f46",
    up: "#6FCF97",
    down: "#f87171",
    entry: "#60a5fa",
    target: "#c084fc",
  };
}

/**
 * @param {{ pick: object, mode?: "pick" | "detail", historyHref?: string }} props
 */
export function PickDailyChart({ pick, mode = "pick", historyHref }) {
  const { t } = useI18n();
  const { effectiveLight } = useTheme();
  const containerRef = useRef(/** @type {HTMLDivElement | null} */ (null));
  const chartRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [bars, setBars] = useState(/** @type {object[] | null} */ (null));
  const [loadFailed, setLoadFailed] = useState(false);

  const jpDeferred = isBarsChartJpDeferred(pick);
  const supported = isBarsChartSupported(pick);

  useEffect(() => {
    if (jpDeferred || !supported) {
      setBars(null);
      setLoadFailed(false);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setLoadFailed(false);
    setBars(null);
    (async () => {
      try {
        const url = await instrumentBarsUrl(pick);
        if (!url || cancelled) return;
        const json = await fetchJsonAllow404(url);
        if (cancelled) return;
        const list = json?.bars ?? [];
        setBars(Array.isArray(list) ? list : []);
      } catch {
        if (!cancelled) setLoadFailed(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pick, jpDeferred, supported]);

  const displayedBars = useMemo(
    () => (bars?.length ? filterChartBars(bars, mode, pick) : []),
    [bars, mode, pick],
  );

  const detailBarCount = useMemo(
    () => (bars?.length ? filterDetailTradingBars(bars).length : 0),
    [bars],
  );

  const showShortDetailNotice =
    mode === "detail" && detailBarCount > 0 && detailBarCount < DETAIL_TRADING_BARS;

  const chartTitle =
    mode === "detail" ? t("pickDetail.chartTabDetail") : t("pickDetail.chartTabPick");

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !displayedBars.length) return;

    const colors = chartColors(effectiveLight);
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const chart = createChart(el, {
      width: el.clientWidth,
      height: 320,
      layout: {
        background: { type: ColorType.Solid, color: colors.background },
        textColor: colors.text,
      },
      grid: {
        vertLines: { color: colors.grid },
        horzLines: { color: colors.grid },
      },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: colors.border },
      timeScale: { borderColor: colors.border, timeVisible: false },
    });
    chartRef.current = chart;

    const series = chart.addCandlestickSeries({
      upColor: colors.up,
      downColor: colors.down,
      borderUpColor: colors.up,
      borderDownColor: colors.down,
      wickUpColor: colors.up,
      wickDownColor: colors.down,
    });

    series.setData(
      displayedBars.map((b) => ({
        time: b.date,
        open: b.open,
        high: b.high,
        low: b.low,
        close: b.close,
      })),
    );

    const pending = isEntryPending(pick);
    const entryPrice = pick.entry?.price;
    const targetPrice = pick.target?.price;

    if (!pending && typeof entryPrice === "number" && entryPrice > 0) {
      series.createPriceLine({
        price: entryPrice,
        color: colors.entry,
        lineWidth: 1,
        lineStyle: 2,
        axisLabelVisible: true,
        title: t("pickDetail.chartEntryLine"),
      });
    }
    if (!pending && typeof targetPrice === "number" && targetPrice > 0) {
      series.createPriceLine({
        price: targetPrice,
        color: colors.target,
        lineWidth: 1,
        lineStyle: 2,
        axisLabelVisible: true,
        title: t("pickDetail.chartTargetLine"),
      });
    }

    chart.timeScale().fitContent();

    const ro = new ResizeObserver(() => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    });
    ro.observe(el);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, [displayedBars, effectiveLight, pick, t]);

  let body = null;
  if (jpDeferred) {
    body = <p className={type.meta}>{t("pickDetail.chartJpPreparing")}</p>;
  } else if (!supported) {
    body = <p className={type.meta}>{t("pickDetail.chartNoData")}</p>;
  } else if (loading) {
    body = <p className={type.meta}>{t("pickDetail.chartLoading")}</p>;
  } else if (loadFailed) {
    body = <p className={type.meta}>{t("pickDetail.chartNoData")}</p>;
  } else if (!displayedBars.length) {
    body = <p className={type.meta}>{t("pickDetail.chartNoData")}</p>;
  } else {
    body = (
      <>
        {showShortDetailNotice ? (
          <p className={`mb-2 ${type.meta}`}>
            {t("pickDetail.chartShortDetailHistory", { count: detailBarCount })}
          </p>
        ) : null}
        <div ref={containerRef} className="h-80 w-full" />
      </>
    );
  }

  return (
    <section className={`mt-4 ${ui.card} ${ui.cardPad}`} aria-labelledby="pick-daily-chart-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="pick-daily-chart-title" className={ui.sectionTitle}>
          {chartTitle}
        </h2>
        {mode === "pick" && historyHref && supported && !jpDeferred && !loading && !loadFailed && bars?.length ? (
          <Link to={historyHref} className={`text-sm ${ui.link}`}>
            {t("pickDetail.chartViewHistoryLink")}
          </Link>
        ) : null}
      </div>
      <div id="pick-daily-chart-panel" className="mt-3">
        {body}
      </div>
    </section>
  );
}
