const styles = {
  active: "bg-emerald-900/50 text-emerald-300 ring-1 ring-emerald-700",
  achieved: "bg-amber-900/50 text-amber-200 ring-1 ring-amber-700",
  expired: "bg-zinc-800 text-zinc-400 ring-1 ring-zinc-600",
  suspended: "bg-orange-900/40 text-orange-200 ring-1 ring-orange-700",
  delisted: "bg-red-900/40 text-red-200 ring-1 ring-red-800",
};

export function StatusBadge({ status }) {
  const s = status || "active";
  const cls = styles[s] || styles.active;
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>{s}</span>
  );
}
