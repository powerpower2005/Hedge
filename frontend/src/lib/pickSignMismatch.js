import { getAchievementSnapshot, getExpirySnapshot, isAchievedPick, isExpiredPick } from "./pickPrices.js";
import { isEntryPending } from "./pickEntry.js";

/**
 * @param {object | null | undefined} pick
 * @returns {number | null}
 */
export function getPickDisplayReturnRate(pick) {
  if (!pick || isEntryPending(pick)) return null;
  if (isAchievedPick(pick)) {
    const ach = getAchievementSnapshot(pick);
    if (ach?.return_rate != null && !Number.isNaN(ach.return_rate)) {
      return ach.return_rate;
    }
    return null;
  }
  if (isExpiredPick(pick)) {
    const expiry = getExpirySnapshot(pick);
    if (expiry?.return_rate != null && !Number.isNaN(expiry.return_rate)) {
      return expiry.return_rate;
    }
    return null;
  }
  const rate = pick?.progress?.current?.return_rate;
  return rate != null && !Number.isNaN(rate) ? rate : null;
}

/**
 * Target and current return point in opposite directions (e.g. bullish pick, negative progress).
 * @param {object | null | undefined} pick
 * @param {number | null | undefined} [currentReturnRate]
 */
export function isTargetCurrentSignMismatch(pick, currentReturnRate) {
  const target = pick?.target?.return_rate;
  const current = currentReturnRate ?? getPickDisplayReturnRate(pick);
  if (target == null || current == null || Number.isNaN(target) || Number.isNaN(current)) {
    return false;
  }
  if (target === 0 || current === 0) return false;
  return (target > 0 && current < 0) || (target < 0 && current > 0);
}
