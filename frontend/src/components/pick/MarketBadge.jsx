import { useI18n } from "../../i18n/I18nContext.jsx";
import { marketBadgeClass } from "../../lib/marketBadge.js";

/**
 * @param {{ pick?: object, market?: string, country?: string, className?: string }} props
 */
export function MarketBadge({ pick, market, country, className = "" }) {
  const { t } = useI18n();
  const label = market ?? pick?.market;
  const code = country ?? pick?.country;
  if (!label) return null;

  const title =
    code === "KR"
      ? t("pickDetail.countryKr")
      : code === "US"
        ? t("pickDetail.countryUs")
        : undefined;

  return (
    <span className={`${marketBadgeClass(code)} ${className}`.trim()} title={title}>
      {label}
    </span>
  );
}
