export function applyFilters(picks, filters) {
  if (!picks?.length) return [];
  return picks.filter((p) => {
    if (filters.country && p.country !== filters.country) return false;
    if (filters.market && p.market !== filters.market) return false;
    if (filters.duration && p.duration?.days !== filters.duration) return false;
    if (filters.ticker && !p.ticker?.toLowerCase().includes(filters.ticker.toLowerCase())) return false;
    if (filters.author && p.author !== filters.author) return false;
    const rr = p.target?.return_rate;
    if (filters.returnMin != null && rr < filters.returnMin) return false;
    if (filters.returnMax != null && rr > filters.returnMax) return false;
    return true;
  });
}

export const SORTERS = {
  latest: (a, b) => (b.created_at || "").localeCompare(a.created_at || ""),
  mostVoted: (a, b) => (b.votes?.likes ?? 0) - (a.votes?.likes ?? 0),
  deadlineSoon: (a, b) =>
    (a.duration?.deadline || "").localeCompare(b.duration?.deadline || ""),
  currentReturn: (a, b) =>
    (b.progress?.current?.return_rate ?? 0) - (a.progress?.current?.return_rate ?? 0),
  nearTarget: (a, b) =>
    (a.progress?.distance_to_target ?? 1) - (b.progress?.distance_to_target ?? 1),
};
