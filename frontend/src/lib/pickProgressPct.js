import { isEntryPending } from "./pickEntry.js";

/**
 * UI progress toward target return (0–100). Same sign only; not used for judgment.
 * @param {import("./pickEntry.js").PickLike | null | undefined} pick
 * @returns {number | null}
 */
export function targetAchievementPercent(pick) {
  if (!pick || isEntryPending(pick)) return null;
  const target = pick.target?.return_rate;
  const current = pick.progress?.current?.return_rate;
  if (target == null || current == null || Number.isNaN(target) || Number.isNaN(current) || target === 0) {
    return null;
  }
  if (target > 0 && current < 0) return 0;
  if (target < 0 && current > 0) return 0;
  return Math.min(100, Math.max(0, Math.round((current / target) * 100)));
}
