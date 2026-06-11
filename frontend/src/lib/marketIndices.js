/**
 * Market index symbols shown in the TradingView mini-chart rail/strip.
 * Symbols use TradingView notation; KR has no Capital.com index so it uses INDEX:KSIC (KOSPI).
 * @type {{ symbol: string, labelKey: string }[]}
 */
export const MARKET_INDICES = [
  { symbol: "CAPITALCOM:NAS100", labelKey: "market.nasdaq100" },
  { symbol: "CAPITALCOM:US500", labelKey: "market.sp500" },
  { symbol: "INDEX:KSIC", labelKey: "market.kospi" },
  { symbol: "CAPITALCOM:HK50", labelKey: "market.hangSeng" },
  { symbol: "CAPITALCOM:J225", labelKey: "market.nikkei225" },
];

/** TradingView web-component module script (KR localization). */
export const TV_MINI_CHART_SCRIPT = "https://widgets.tradingview-widget.com/w/kr/tv-mini-chart.js";
