import { useMemo, useState } from "react";
import { FilterBar } from "../components/filters/FilterBar.jsx";
import { PickList } from "../components/pick/PickList.jsx";
import { applyFilters, SORTERS } from "../lib/filters.js";
import { isEntryPending } from "../lib/pickEntry.js";
import { useI18n } from "../i18n/I18nContext.jsx";
import { usePicks } from "../hooks/usePicks.js";
import { type } from "../lib/typographyClasses.js";
import { ui } from "../lib/themeClasses.js";
import { PageLoading } from "../components/ui/PageLoading.jsx";
import { dataLoadErrorMessage } from "../lib/userMessages.js";

export function PendingEntryPage() {
  const { t } = useI18n();
  const { picks: activePicks, loading, error } = usePicks("active");
  const [filters, setFilters] = useState({});
  const [sortKey, setSortKey] = useState("latest");

  const pendingPicks = useMemo(
    () => activePicks.filter((p) => isEntryPending(p)),
    [activePicks],
  );

  const visible = useMemo(() => {
    const f = applyFilters(pendingPicks, filters);
    const sorter = SORTERS[sortKey] || SORTERS.latest;
    return [...f].sort(sorter);
  }, [pendingPicks, filters, sortKey]);

  if (loading) return <PageLoading />;
  if (error) return <p className="px-4 py-8 text-red-400 light:text-red-600">{dataLoadErrorMessage(error, t)}</p>;

  return (
    <article className={ui.page}>
      <h1 className={type.pageTitle}>{t("pendingEntryPage.title")}</h1>
      <p className={`mt-2 mb-8 ${type.pageLead}`}>{t("pendingEntryPage.subtitle")}</p>
      <FilterBar filters={filters} setFilters={setFilters} sortKey={sortKey} setSortKey={setSortKey} />
      <PickList picks={visible} />
    </article>
  );
}
