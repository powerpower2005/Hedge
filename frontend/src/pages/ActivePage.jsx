import { useMemo, useState } from "react";
import { FilterBar } from "../components/filters/FilterBar.jsx";
import { PickList } from "../components/pick/PickList.jsx";
import { applyFilters, SORTERS } from "../lib/filters.js";
import { useI18n } from "../i18n/I18nContext.jsx";
import { usePicks } from "../hooks/usePicks.js";
import { dataLoadErrorMessage } from "../lib/userMessages.js";

export function ActivePage() {
  const { t } = useI18n();
  const { picks, loading, error, meta } = usePicks("active");
  const [filters, setFilters] = useState({});
  const [sortKey, setSortKey] = useState("latest");

  const visible = useMemo(() => {
    const f = applyFilters(picks, filters);
    const sorter = SORTERS[sortKey] || SORTERS.latest;
    return [...f].sort(sorter);
  }, [picks, filters, sortKey]);

  const count = meta?.count ?? picks.length;

  if (loading) return <p className="px-4 py-8 text-zinc-500 light:text-zinc-600">{t("common.loading")}</p>;
  if (error) return <p className="px-4 py-8 text-red-400 light:text-red-600">{dataLoadErrorMessage(error, t)}</p>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold text-white light:text-zinc-900">{t("active.title")}</h1>
      <p className="mb-6 text-sm text-zinc-400 light:text-zinc-600">{t("active.subtitle", { count })}</p>
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
