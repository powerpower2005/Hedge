/** @typedef {{ author: string, total: number, wins: number, expired: number, resolved: number, winRate: number | null }} UserStatRow */

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
    for (const p of ps) {
      const s = p?.status?.current;
      if (s === "achieved") wins += 1;
      else if (s === "expired") expired += 1;
    }
    const total = ps.length;
    const resolved = wins + expired;
    const winRate = resolved > 0 ? wins / resolved : null;
    rows.push({ author, total, wins, expired, resolved, winRate });
  }
  return rows;
}

/** @param {UserStatRow} a @param {UserStatRow} b */
function cmpWinRate(a, b) {
  if (a.winRate == null && b.winRate == null) return 0;
  if (a.winRate == null) return 1;
  if (b.winRate == null) return -1;
  if (b.winRate !== a.winRate) return b.winRate - a.winRate;
  if (b.wins !== a.wins) return b.wins - a.wins;
  return b.total - a.total;
}

/** @param {UserStatRow} a @param {UserStatRow} b */
function cmpAttempts(a, b) {
  if (b.total !== a.total) return b.total - a.total;
  if (b.wins !== a.wins) return b.wins - a.wins;
  return a.author.localeCompare(b.author);
}

/** @param {UserStatRow} a @param {UserStatRow} b */
function cmpWins(a, b) {
  if (b.wins !== a.wins) return b.wins - a.wins;
  if (b.total !== a.total) return b.total - a.total;
  return a.author.localeCompare(b.author);
}

/** @param {UserStatRow[]} rows @param {"winRate"|"attempts"|"wins"} sortKey */
export function sortUserStats(rows, sortKey) {
  const copy = [...rows];
  if (sortKey === "attempts") copy.sort(cmpAttempts);
  else if (sortKey === "wins") copy.sort(cmpWins);
  else copy.sort(cmpWinRate);
  return copy;
}
