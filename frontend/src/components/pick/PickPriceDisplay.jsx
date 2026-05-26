import { useState } from "react";
import { useI18n } from "../../i18n/I18nContext.jsx";
import { formatPrice } from "../../lib/formatters.js";
import { isEntryPending } from "../../lib/pickEntry.js";
import {
  formatSessionDateDisplay,
  getAchievementSnapshot,
  getExpirySnapshot,
  getLatestPriceSnapshot,
  isAchievedPick,
  isExpiredPick,
} from "../../lib/pickPrices.js";
import { ui } from "../../lib/themeClasses.js";
import { type } from "../../lib/typographyClasses.js";

/**
 * @param {{
 *   pick: object,
 *   size: "sm" | "lg",
 *   className: string,
 *   labelWithDate: string,
 *   snapshot: { close: number, session_date: string },
 *   latest: ReturnType<typeof getLatestPriceSnapshot>,
 * }} props
 */
function SnapshotPriceBlock({ pick, size, className, labelWithDate, snapshot, latest }) {
  const { t } = useI18n();
  const [showLatest, setShowLatest] = useState(false);
  const priceClass = size === "lg" ? ui.valueLg : "text-sm font-semibold tabular-nums text-zinc-100 light:text-zinc-900";
  const sessionDate = formatSessionDateDisplay(snapshot.session_date);
  const latestDate = latest ? formatSessionDateDisplay(latest.session_date) : "";
  const sameAsLatest =
    latest &&
    latest.close === snapshot.close &&
    sessionDate &&
    latestDate &&
    sessionDate === latestDate;

  return (
    <div className={className}>
      <p className={size === "lg" ? ui.label : `${type.meta} mb-0.5`}>
        {t(labelWithDate, { date: sessionDate })}
      </p>
      <p className={`${priceClass} ${size === "lg" ? "!text-2xl !font-bold" : ""}`}>
        {formatPrice(pick.country, snapshot.close)}
      </p>
      {latest && !sameAsLatest ? (
        <div className="mt-2">
          <button
            type="button"
            className={`text-xs font-medium ${ui.link}`}
            aria-expanded={showLatest}
            onClick={() => setShowLatest((v) => !v)}
          >
            {showLatest ? t("pickDetail.hideCurrentPrice") : t("pickDetail.showCurrentPrice")}
          </button>
          {showLatest ? (
            <p className={`mt-1.5 ${type.bodySm}`}>
              <span className="text-zinc-400 light:text-zinc-600">
                {t("pickDetail.currentPriceOnDate", { date: latestDate })}
              </span>
              <span className={`ml-2 tabular-nums font-semibold text-zinc-200 light:text-zinc-800`}>
                {formatPrice(pick.country, latest.close)}
              </span>
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/**
 * @param {{ pick: object, size?: "sm" | "lg", className?: string }} props
 */
export function PickPriceDisplay({ pick, size = "sm", className = "" }) {
  const { t } = useI18n();
  const unavailable = t("common.notAvailable");
  const priceClass = size === "lg" ? ui.valueLg : "text-sm font-semibold tabular-nums text-zinc-100 light:text-zinc-900";

  if (isEntryPending(pick)) return null;

  const latest = getLatestPriceSnapshot(pick);

  if (isAchievedPick(pick)) {
    const achieved = getAchievementSnapshot(pick);
    if (!achieved) {
      return (
        <div className={className}>
          <p className={size === "lg" ? ui.label : `${type.meta} mb-0.5`}>{t("pickDetail.achievedClosePrice")}</p>
          <p className={`${priceClass} ${size === "lg" ? "!text-2xl !font-bold" : ""} text-zinc-500 light:text-zinc-600`}>
            {unavailable}
          </p>
        </div>
      );
    }
    return (
      <SnapshotPriceBlock
        pick={pick}
        size={size}
        className={className}
        labelWithDate="pickDetail.achievedClosePriceOnDate"
        snapshot={achieved}
        latest={latest}
      />
    );
  }

  if (isExpiredPick(pick)) {
    const expiry = getExpirySnapshot(pick);
    if (!expiry) {
      return (
        <div className={className}>
          <p className={size === "lg" ? ui.label : `${type.meta} mb-0.5`}>{t("pickDetail.expiryClosePrice")}</p>
          <p className={`${priceClass} ${size === "lg" ? "!text-2xl !font-bold" : ""} text-zinc-500 light:text-zinc-600`}>
            {unavailable}
          </p>
        </div>
      );
    }
    return (
      <SnapshotPriceBlock
        pick={pick}
        size={size}
        className={className}
        labelWithDate="pickDetail.expiryClosePriceOnDate"
        snapshot={expiry}
        latest={latest}
      />
    );
  }

  if (!latest) {
    return (
      <span className={`${priceClass} ${className}`} aria-hidden>
        —
      </span>
    );
  }

  const dateLabel = formatSessionDateDisplay(latest.session_date);
  return (
    <div className={className}>
      {size === "lg" ? (
        <p className={ui.label}>{t("pickDetail.currentPriceOnDate", { date: dateLabel })}</p>
      ) : null}
      <span className={priceClass}>{formatPrice(pick.country, latest.close)}</span>
      {size === "sm" && dateLabel ? (
        <span className={`ml-1 ${type.meta}`}>({dateLabel})</span>
      ) : null}
    </div>
  );
}
