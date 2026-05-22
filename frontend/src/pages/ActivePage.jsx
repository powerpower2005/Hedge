import { useMemo, useState } from "react";
import { FilterBar } from "../components/filters/FilterBar.jsx";
import { PickList } from "../components/pick/PickList.jsx";
import { applyFilters, SORTERS } from "../lib/filters.js";
import { useI18n } from "../i18n/I18nContext.jsx";
import { usePicks } from "../hooks/usePicks.js";
import { type } from "../lib/typographyClasses.js";
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
    <article className="mx-auto w-full max-w-6xl px-3 py-6 sm:px-4 sm:py-8 xl:px-6">
      <header className="mb-6 max-w-2xl border-b border-zinc-800 pb-6 light:border-zinc-200">
        <p className="text-base font-semibold leading-snug text-zinc-100 light:text-zinc-900">
          {t("guide.quickTagline")}
        </p>
        <p className={`mt-3 ${type.pageLead}`}>{t("active.nextStep")}</p>
      </header>

      <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h1 id="active-page-title" className={type.pageTitle}>
          {t("active.title")}
        </h1>
        <p className={type.meta}>{t("active.subtitle", { count })}</p>
      </div>

      <PickList picks={visible} />

      <section className="mt-8" aria-labelledby="active-filters-heading">
        <h2 id="active-filters-heading" className="sr-only">
          {t("filters.sort")}
        </h2>
        <FilterBar
          filters={filters}
          setFilters={setFilters}
          sortKey={sortKey}
          setSortKey={setSortKey}
        />
      </section>
    </article>
  );
}
