/** @param {object} p */
export function achievedDateIso10(p) {
  const raw = p?.achievement?.achieved_date;
  if (typeof raw !== "string" || raw.length < 10) return "";
  return raw.slice(0, 10);
}

export function currentUtcYearMonth() {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function currentUtcYear() {
  return String(new Date().getUTCFullYear());
}

/** @param {object[]} picks */
export function distinctYearMonthsFromPicks(picks) {
  const set = new Set();
  for (const p of picks || []) {
    const d = achievedDateIso10(p);
    if (d.length >= 7) set.add(d.slice(0, 7));
  }
  return [...set].sort((a, b) => b.localeCompare(a));
}

/** @param {object[]} picks */
export function distinctYearsFromPicks(picks) {
  const set = new Set();
  for (const p of picks || []) {
    const d = achievedDateIso10(p);
    if (d.length >= 4) set.add(d.slice(0, 4));
  }
  return [...set].sort((a, b) => b.localeCompare(a));
}

/**
 * @param {object[]} picks
 * @param {string} selectedMonth YYYY-MM
 * @param {string} selectedYear YYYY
 */
export function monthSelectOptions(picks, selectedMonth) {
  const merged = new Set([
    ...distinctYearMonthsFromPicks(picks),
    selectedMonth,
    currentUtcYearMonth(),
  ]);
  return [...merged].sort((a, b) => b.localeCompare(a));
}

/**
 * @param {object[]} picks
 * @param {string} selectedYear YYYY
 */
export function yearSelectOptions(picks, selectedYear) {
  const merged = new Set([
    ...distinctYearsFromPicks(picks),
    selectedYear,
    currentUtcYear(),
  ]);
  return [...merged].sort((a, b) => b.localeCompare(a));
}

/**
 * @param {string} ym YYYY-MM
 * @param {string} locale e.g. "ko", "en"
 */
export function formatYearMonthLabel(ym, locale) {
  const parts = ym.split("-").map(Number);
  if (parts.length < 2 || Number.isNaN(parts[0]) || Number.isNaN(parts[1])) return ym;
  const [y, mo] = parts;
  const d = new Date(Date.UTC(y, mo - 1, 1));
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "ko-KR", {
    year: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(d);
}
