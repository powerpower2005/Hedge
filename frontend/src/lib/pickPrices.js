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
 * @param {object | null | undefined} pick
 * @returns {boolean}
 */
export function isAchievedPick(pick) {
  return pick?.status?.current === "achieved";
}

/**
 * Close on the judgment day the target was reached.
 * @param {object | null | undefined} pick
 * @returns {PriceSnapshot | null}
 */
export function getAchievementSnapshot(pick) {
  const ach = pick?.achievement;
  const close = ach?.achieved_close;
  if (close == null || Number.isNaN(close)) return null;
  const session_date = ach?.achieved_date;
  if (!session_date || typeof session_date !== "string") return null;
  const return_rate = ach?.final_return_rate;
  return {
    close,
    session_date,
    return_rate:
      return_rate != null && !Number.isNaN(return_rate) ? return_rate : undefined,
  };
}

/**
 * Last daily close while the pick was still in-window (judgment_day <= deadline).
 * Backend sets pick.expiry on expire; legacy rows may only have progress overwritten later.
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
