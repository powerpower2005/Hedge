import { Link } from "react-router-dom";
import { isTargetCurrentSignMismatch } from "../../lib/pickSignMismatch.js";
import { ui } from "../../lib/themeClasses.js";
import { type } from "../../lib/typographyClasses.js";

const mismatchNameClass = "text-red-400 light:text-red-700";

/**
 * @param {{ pick: object, variant?: "card" | "list" | "detail", currentReturnRate?: number | null, className?: string }} props
 */
export function PickInstrumentHeading({
  pick,
  variant = "card",
  currentReturnRate,
  className = "",
}) {
  const pickId = pick?.id;
  const ticker = pick?.ticker ?? "";
  const instrumentName = pick?.instrument_name?.trim() || "";
  const primaryLabel = instrumentName || ticker;
  const showTickerSubline = Boolean(instrumentName && ticker);
  const mismatch = isTargetCurrentSignMismatch(pick, currentReturnRate);

  const primaryBase =
    variant === "detail"
      ? ui.instrumentPrimary
      : variant === "list"
        ? `${ui.instrumentPrimary} text-base sm:text-lg`
        : ui.instrumentPrimary;
  const primaryClass = `${primaryBase} hover:underline ${mismatch ? mismatchNameClass : ""}`;

  const tickerClass = `${ui.tickerSecondary} hover:underline`;

  const primaryEl = pickId ? (
    <Link to={`/pick/${pickId}`} className={`block truncate ${primaryClass}`}>
      {primaryLabel}
    </Link>
  ) : (
    <span className={`block truncate ${primaryClass}`}>{primaryLabel}</span>
  );

  const tickerEl =
    showTickerSubline && pickId ? (
      <Link to={`/pick/${pickId}`} className={tickerClass}>
        {ticker}
      </Link>
    ) : showTickerSubline ? (
      <span className={tickerClass}>{ticker}</span>
    ) : null;

  if (variant === "detail") {
    return (
      <div className={className}>
        <h1 className={`truncate ${primaryClass}`}>{primaryLabel}</h1>
        {showTickerSubline ? (
          <p className="mt-1.5 flex flex-wrap items-center gap-2">
            {tickerEl}
            <span className={ui.badgeMarket}>{pick.market}</span>
          </p>
        ) : (
          <p className="mt-1.5">
            <span className={ui.badgeMarket}>{pick.market}</span>
          </p>
        )}
      </div>
    );
  }

  if (variant === "list") {
    return (
      <div className={`min-w-0 ${className}`}>
        {primaryEl}
        {showTickerSubline ? <p className={`mt-0.5 truncate ${type.meta}`}>{tickerEl}</p> : null}
      </div>
    );
  }

  return (
    <div className={`min-w-0 ${className}`}>
      {primaryEl}
      <div className="mt-1 flex flex-wrap items-center gap-2">
        {tickerEl}
        <span className={ui.badgeMarket}>{pick.market}</span>
      </div>
    </div>
  );
}
