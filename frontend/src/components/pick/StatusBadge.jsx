import { useI18n } from "../../i18n/I18nContext.jsx";

const styles = {
  pending_entry:
    "bg-sky-900/40 text-sky-200 ring-1 ring-sky-700 light:bg-sky-50 light:text-sky-800 light:ring-sky-200",
  active:
    "bg-primary-900/50 text-primary-200 ring-1 ring-primary-700 light:bg-primary-100 light:text-primary-800 light:ring-primary-200",
  achieved:
    "bg-amber-900/50 text-amber-200 ring-1 ring-amber-700 light:bg-amber-50 light:text-amber-900 light:ring-amber-200",
  expired:
    "bg-zinc-800 text-zinc-400 ring-1 ring-zinc-600 light:bg-zinc-100 light:text-zinc-600 light:ring-zinc-200",
  suspended:
    "bg-orange-900/40 text-orange-200 ring-1 ring-orange-700 light:bg-orange-50 light:text-orange-800",
  delisted: "bg-red-900/40 text-red-200 ring-1 ring-red-800 light:bg-red-50 light:text-red-800",
};

export function StatusBadge({ status, title }) {
  const { t } = useI18n();
  const s = status || "active";
  const cls = styles[s] || styles.active;
  const label = t(`status.${s}`) || s;
  return (
    <span
      title={title}
      className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}
    >
      {label}
    </span>
  );
}
