import { useI18n } from "../../i18n/I18nContext.jsx";

const styles = {
  pending_entry: "bg-sky-900/40 text-sky-200 ring-1 ring-sky-700",
  active: "bg-emerald-900/50 text-emerald-300 ring-1 ring-emerald-700",
  achieved: "bg-amber-900/50 text-amber-200 ring-1 ring-amber-700",
  expired: "bg-zinc-800 text-zinc-400 ring-1 ring-zinc-600",
  suspended: "bg-orange-900/40 text-orange-200 ring-1 ring-orange-700",
  delisted: "bg-red-900/40 text-red-200 ring-1 ring-red-800",
};

export function StatusBadge({ status, title }) {
  const { t } = useI18n();
  const s = status || "active";
  const cls = styles[s] || styles.active;
  const label = t(`status.${s}`) || s;
  return (
    <span
      title={title}
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}
    >
      {label}
    </span>
  );
}
