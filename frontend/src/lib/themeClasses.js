/** Green SaaS theme (#EEEEEE / #6FCF97 / #2FA084 / #1F6F5F; red unchanged). */

export const ui = {
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
    return `inline-flex shrink-0 items-center justify-center text-center ${width} px-2 py-2.5 text-sm font-semibold leading-tight whitespace-nowrap transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500 ${tone}`;
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
  value: "text-sm font-semibold text-zinc-100 light:text-zinc-900",
  valueLg: "text-lg font-bold tabular-nums text-zinc-100 light:text-zinc-900",
  sectionTitle: "text-lg font-bold text-zinc-100 light:text-zinc-900",
  link: "font-medium text-primary-400 underline-offset-2 hover:text-primary-300 hover:underline light:text-primary-700 light:hover:text-primary-800",
};
