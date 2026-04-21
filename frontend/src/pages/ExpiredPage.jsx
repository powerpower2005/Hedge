import { useMemo, useState } from "react";
import { FilterBar } from "../components/filters/FilterBar.jsx";
import { PickList } from "../components/pick/PickList.jsx";
import { applyFilters, SORTERS } from "../lib/filters.js";
import { usePicks } from "../hooks/usePicks.js";

export function ExpiredPage() {
  const { picks, loading, error } = usePicks("expired");
  const [filters, setFilters] = useState({});
  const [sortKey, setSortKey] = useState("latest");

  const visible = useMemo(() => {
    const f = applyFilters(picks, filters);
    const sorter = SORTERS[sortKey] || SORTERS.latest;
    return [...f].sort(sorter);
  }, [picks, filters, sortKey]);

  if (loading) return <p className="px-4 py-8 text-zinc-500">Loading…</p>;
  if (error) return <p className="px-4 py-8 text-red-400">Failed to load: {String(error)}</p>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-white dark:text-zinc-900">Recently expired</h1>
      <FilterBar
        filters={filters}
        setFilters={setFilters}
        sortKey={sortKey}
        setSortKey={setSortKey}
      />
      <PickList picks={visible} />
    </div>
  );
}
