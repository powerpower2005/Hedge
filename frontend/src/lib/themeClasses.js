/** Green SaaS theme (#EEEEEE / #6FCF97 / #2FA084 / #1F6F5F; red unchanged). */

export const ui = {
  /** Shared horizontal shell — header, footer, and page content use the same max width. */
  shell: "mx-auto w-full max-w-6xl px-3 sm:px-4 xl:px-6",
  page: "mx-auto w-full max-w-6xl px-3 py-6 sm:px-4 sm:py-8 xl:px-6",
  card:
    "rounded-2xl border-2 border-zinc-600 bg-zinc-900 shadow-sm light:border-zinc-300 light:bg-white light:shadow-md",
  dialog:
    "rounded-2xl border-2 border-zinc-600 bg-zinc-900 shadow-xl light:border-zinc-300 light:bg-white",
  cardPad: "p-5 sm:p-6",
  innerPanel:
    "rounded-xl border-2 border-zinc-600/90 bg-zinc-800/40 p-3 light:border-zinc-300 light:bg-zinc-50",
  field:
    "mt-1 rounded-lg border-2 border-zinc-600 bg-zinc-950 px-2.5 py-1.5 text-sm text-white shadow-sm light:border-zinc-300 light:bg-white light:text-zinc-900",
  filterField:
    "w-full rounded-lg border-2 border-zinc-600 bg-zinc-950 px-2.5 py-1.5 text-sm text-white shadow-sm light:border-zinc-300 light:bg-white light:text-zinc-900",
  hero:
    "rounded-2xl border-2 border-primary-700/50 bg-gradient-to-br from-primary-950/50 via-zinc-900 to-zinc-900 p-6 sm:p-8 light:border-primary-400 light:from-primary-50 light:via-primary-100 light:to-white",
  btnPrimary:
    "inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-500 focus-visible:outline-none light:bg-primary-600 light:hover:bg-primary-500",
  btnPrimaryLg:
    "inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary-600 px-5 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-primary-500 focus-visible:outline-none light:bg-primary-600 light:hover:bg-primary-500",
  btnSecondary:
    "inline-flex items-center justify-center gap-1.5 rounded-xl border-2 border-zinc-600 bg-zinc-800/60 px-4 py-2.5 text-sm font-medium text-zinc-100 transition hover:bg-zinc-800 light:border-zinc-300 light:bg-white light:text-zinc-800 light:hover:bg-zinc-50",
  btnSecondaryLg:
    "inline-flex items-center justify-center gap-1.5 rounded-xl border-2 border-zinc-600 bg-zinc-800/60 px-5 py-3 text-base font-medium text-zinc-100 transition hover:bg-zinc-800 light:border-zinc-300 light:bg-white light:text-zinc-800 light:hover:bg-zinc-50",
  statCard:
    "rounded-2xl border-2 border-zinc-600 bg-zinc-900 p-4 shadow-sm light:border-zinc-300 light:bg-white",
  /** Segmented tab bar: equal-width cells, centered labels. variant: "default" | "compact" */
  /** overflow-hidden clips active tab fill to rounded border; dropdowns use a portal. */
  navGroup:
    "inline-grid max-w-full auto-cols-max grid-flow-col items-stretch divide-x-2 divide-zinc-600 overflow-hidden rounded-xl border-2 border-zinc-600 bg-zinc-900/70 shadow-sm light:divide-zinc-300 light:border-zinc-300 light:bg-white",
  navTab: (active, variant = "default") => {
    const width =
      variant === "compact"
        ? "w-[4.75rem] min-w-[4.75rem]"
        : "w-[7.75rem] min-w-[7.75rem] sm:w-[8.25rem] sm:min-w-[8.25rem]";
    const tone = active
      ? "bg-primary-600 text-white light:bg-primary-600 light:text-white"
      : "bg-zinc-900/40 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 light:bg-white light:text-zinc-600 light:hover:bg-zinc-100 light:hover:text-zinc-900";
    return `inline-flex h-full shrink-0 items-center justify-center text-center ${width} px-2 py-2.5 text-sm font-semibold leading-tight whitespace-nowrap transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-offset-0 focus-visible:ring-primary-500 ${tone}`;
  },
  navDropdownItem: (active) =>
    `block px-4 py-2.5 text-sm font-medium transition ${
      active
        ? "bg-primary-600/15 text-primary-300 light:bg-primary-50 light:text-primary-800"
        : "text-zinc-200 hover:bg-zinc-800 light:text-zinc-800 light:hover:bg-zinc-100"
    }`,
  ticker: "text-xl font-bold tracking-tight text-primary-400 sm:text-2xl light:text-primary-700",
  instrumentPrimary:
    "text-base font-bold leading-snug tracking-tight text-zinc-100 sm:text-lg light:text-zinc-900",
  tickerSecondary:
    "text-xs font-bold tracking-wide text-primary-400 tabular-nums light:text-primary-700",
  label: "text-xs font-medium text-zinc-400 light:text-zinc-600",
  value: "text-sm font-semibold tabular-nums text-zinc-100 light:text-zinc-900",
  valueLg: "text-lg font-bold tabular-nums text-zinc-100 light:text-zinc-900",
  /** Stat / KPI cards: label and value stacked, left-aligned */
  statValue:
    "mt-2 text-2xl font-bold tabular-nums tracking-tight text-zinc-100 light:text-zinc-900",
  statHint: "mt-1 text-[11px] leading-snug text-zinc-500 light:text-zinc-600",
  /** 2+ column metric grids inside cards */
  metricGrid: "grid grid-cols-2 gap-3 sm:gap-4",
  metricBlock: "min-w-0",
  metricValue: "mt-1 tabular-nums",
  /** Data tables: names left, numbers right */
  table: "w-full border-collapse text-sm",
  tableHeadRow:
    "border-b border-zinc-800 bg-zinc-900/40 light:border-zinc-200 light:bg-zinc-100",
  tableBodyRow:
    "border-b border-zinc-800/80 last:border-0 odd:bg-zinc-950/40 light:border-zinc-100 light:odd:bg-zinc-50/80",
  th: "px-3 py-2.5 text-left text-xs font-semibold text-zinc-400 whitespace-nowrap light:text-zinc-600",
  thNum:
    "px-3 py-2.5 text-right text-xs font-semibold text-zinc-400 whitespace-nowrap light:text-zinc-600",
  td: "px-3 py-2.5 align-top text-sm text-zinc-100 light:text-zinc-900",
  tdNum: "px-3 py-2.5 align-top text-right text-sm tabular-nums text-zinc-100 light:text-zinc-900",
  /** Mobile definition lists (label left, value right) */
  dlGrid: "grid grid-cols-2 gap-x-4 gap-y-3 text-xs sm:grid-cols-3 sm:text-sm",
  dlCell: "min-w-0",
  dlLabel: "text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-400 light:text-zinc-600",
  dlValue: "mt-0.5 text-left tabular-nums font-semibold text-zinc-100 light:text-zinc-900 sm:text-right",
  dlValueText: "mt-0.5 text-left font-medium text-zinc-200 light:text-zinc-800 sm:text-right",
  sectionTitle: "text-lg font-bold text-zinc-100 light:text-zinc-900",
  link: "font-medium text-primary-400 underline-offset-2 hover:text-primary-300 hover:underline light:text-primary-700 light:hover:text-primary-800",
};
