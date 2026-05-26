import { useState } from "react";
import { useI18n } from "../../i18n/I18nContext.jsx";
import { formatPrice } from "../../lib/formatters.js";
import { isEntryPending } from "../../lib/pickEntry.js";
import {
  formatSessionDateDisplay,
  getExpirySnapshot,
  getLatestPriceSnapshot,
  isExpiredPick,
} from "../../lib/pickPrices.js";
import { ui } from "../../lib/themeClasses.js";
import { type } from "../../lib/typographyClasses.js";

/**
 * @param {{ pick: object, size?: "sm" | "lg", className?: string }} props
 */
export function PickPriceDisplay({ pick, size = "sm", className = "" }) {
  const { t } = useI18n();
  const [showLatest, setShowLatest] = useState(false);

  if (isEntryPending(pick)) return null;

  const expired = isExpiredPick(pick);
  const expiry = expired ? getExpirySnapshot(pick) : null;
  const latest = getLatestPriceSnapshot(pick);

  const priceClass = size === "lg" ? ui.valueLg : "text-sm font-semibold tabular-nums text-zinc-100 light:text-zinc-900";

  if (expired && expiry) {
    const expiryDate = formatSessionDateDisplay(expiry.session_date);
    const latestDate = latest ? formatSessionDateDisplay(latest.session_date) : "";
    const sameAsLatest =
      latest &&
      latest.close === expiry.close &&
      expiryDate &&
      latestDate &&
      expiryDate === latestDate;

    return (
      <div className={className}>
        <p className={size === "lg" ? ui.label : `${type.meta} mb-0.5`}>
          {t("pickDetail.expiryClosePriceOnDate", { date: expiryDate })}
        </p>
        <p className={`${priceClass} ${size === "lg" ? "!text-2xl !font-bold" : ""}`}>
          {formatPrice(pick.country, expiry.close)}
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
