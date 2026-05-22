import { useI18n } from "../../i18n/I18nContext.jsx";
import { ui } from "../../lib/themeClasses.js";

export function ProgressBar({ percent, label }) {
  const { t } = useI18n();
  const textLabel = label ?? t("pickDetail.targetAchievement");
  if (percent == null) return null;
  return (
    <div className="mt-4">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className={ui.label}>{textLabel}</span>
        <span className={`${ui.label} tabular-nums font-semibold`}>{percent}%</span>
      </div>
      <div
        className="h-2.5 overflow-hidden rounded-full bg-zinc-700 light:bg-zinc-200"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={textLabel}
      >
        <div
          className="h-full rounded-full bg-primary-500 transition-[width] light:bg-primary-600"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
