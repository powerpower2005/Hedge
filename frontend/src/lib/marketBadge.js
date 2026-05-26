const badgeBase =
  "inline-flex shrink-0 items-center rounded-md border px-2 py-0.5 text-xs font-bold tracking-wide";

/** @param {string | null | undefined} country */
export function marketBadgeClass(country) {
  if (country === "KR") {
    return `${badgeBase} border-rose-700/80 bg-rose-950/70 text-rose-200 light:border-rose-300 light:bg-rose-50 light:text-rose-900`;
  }
  if (country === "US") {
    return `${badgeBase} border-sky-700/80 bg-sky-950/70 text-sky-200 light:border-sky-300 light:bg-sky-50 light:text-sky-900`;
  }
  return `${badgeBase} border-zinc-600 bg-zinc-800/90 text-zinc-200 light:border-zinc-300 light:bg-zinc-100 light:text-zinc-800`;
}
