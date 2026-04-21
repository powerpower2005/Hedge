import { PickCard } from "./PickCard.jsx";
import { useI18n } from "../../i18n/I18nContext.jsx";

export function PickList({ picks }) {
  const { t } = useI18n();
  if (!picks?.length) {
    return (
      <p className="rounded-lg border border-dashed border-zinc-700 p-8 text-center text-zinc-500 light:border-zinc-300 light:text-zinc-600">
        {t("pickList.empty")}
      </p>
    );
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {picks.map((p) => (
        <PickCard key={p.id} pick={p} />
      ))}
    </div>
  );
}
