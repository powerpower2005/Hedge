/** @typedef {{ author: string, total: number, wins: number, expired: number, winRate: number | null, totalReturn: number }} UserStatRow */

/**
 * @param {object} p
 * @returns {number}
 */
export function pickReturnForLeaderboard(p) {
  if (p?.status?.current === "achieved" && typeof p?.achievement?.final_return_rate === "number") {
    return p.achievement.final_return_rate;
  }
  const r = p?.progress?.current?.return_rate;
  return typeof r === "number" && !Number.isNaN(r) ? r : 0;
}

/**
 * @param {object[]} allPicks
 * @returns {UserStatRow[]}
 */
export function aggregateUserStats(allPicks) {
  const byAuthor = new Map();
  for (const p of allPicks || []) {
    const author = p?.author;
    if (typeof author !== "string" || !author) continue;
    if (!byAuthor.has(author)) byAuthor.set(author, []);
    byAuthor.get(author).push(p);
  }

  const rows = [];
  for (const [author, ps] of byAuthor) {
    let wins = 0;
    let expired = 0;
    let totalReturn = 0;
    for (const p of ps) {
      const s = p?.status?.current;
      if (s === "achieved") wins += 1;
      else if (s === "expired") expired += 1;
      totalReturn += pickReturnForLeaderboard(p);
    }
    const total = ps.length;
    const winRate = total > 0 ? wins / total : null;
    rows.push({ author, total, wins, expired, winRate, totalReturn });
  }
  return rows;
}

/** @param {number | null} rate */
function winRateSortKey(rate) {
  return rate == null ? -1 : rate;
}

/** @param {UserStatRow} a @param {UserStatRow} b */
function cmpLeaderboardRank(a, b) {
  if (b.wins !== a.wins) return b.wins - a.wins;
  const wr = winRateSortKey(b.winRate) - winRateSortKey(a.winRate);
  if (wr !== 0) return wr;
  if (b.totalReturn !== a.totalReturn) return b.totalReturn - a.totalReturn;
  return a.author.localeCompare(b.author);
}

/** Fixed ranking: wins → win rate → total return → username. */
export function sortLeaderboardStats(rows) {
  return [...rows].sort(cmpLeaderboardRank);
}
