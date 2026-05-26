/** @typedef {{ close: number, session_date: string, return_rate?: number }} PriceSnapshot */

/**
 * @param {string | null | undefined} iso YYYY-MM-DD or ISO datetime
 * @returns {string} e.g. 2026.07.16
 */
export function formatSessionDateDisplay(iso) {
  if (iso == null || typeof iso !== "string") return "";
  const m = iso.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return iso.trim();
  return `${m[1]}.${m[2]}.${m[3]}`;
}

/**
 * @param {object | null | undefined} pick
 * @returns {boolean}
 */
export function isExpiredPick(pick) {
  return pick?.status?.current === "expired";
}

/**
 * Last in-window close at expiry (preferred). Legacy picks: infer from progress extremes.
 * @param {object | null | undefined} pick
 * @returns {PriceSnapshot | null}
 */
export function getExpirySnapshot(pick) {
  const ex = pick?.expiry;
  if (ex?.close != null && !Number.isNaN(ex.close)) {
    return {
      close: ex.close,
      session_date: ex.session_date || pick?.duration?.deadline || "",
      return_rate: ex.return_rate,
    };
  }

  const deadline = pick?.duration?.deadline;
  if (!deadline) return null;

  const bearish = (pick?.target?.return_rate ?? 0) < 0;
  const extreme = bearish ? pick?.progress?.lowest : pick?.progress?.highest;
  if (
    extreme?.close != null &&
    extreme.close_date &&
    extreme.close_date <= deadline &&
    !Number.isNaN(extreme.close)
  ) {
    return {
      close: extreme.close,
      session_date: extreme.close_date,
      return_rate: extreme.return_rate,
    };
  }

  const updated = pick?.progress?.updated_at;
  const current = pick?.progress?.current;
  if (
    updated &&
    updated <= deadline &&
    current?.close != null &&
    !Number.isNaN(current.close)
  ) {
    return {
      close: current.close,
      session_date: updated,
      return_rate: current.return_rate,
    };
  }

  if (current?.close != null && !Number.isNaN(current.close)) {
    return {
      close: current.close,
      session_date: deadline,
      return_rate: current.return_rate,
    };
  }
  return null;
}

/**
 * Latest judgment close (post-expiry for expired picks).
 * @param {object | null | undefined} pick
 * @returns {PriceSnapshot | null}
 */
export function getLatestPriceSnapshot(pick) {
  const close = pick?.progress?.current?.close;
  if (close == null || Number.isNaN(close)) return null;
  return {
    close,
    session_date: pick?.progress?.updated_at || "",
    return_rate: pick?.progress?.current?.return_rate,
  };
}
