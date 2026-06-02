import { ui } from "../../lib/themeClasses.js";

/**
 * @param {{ label: string, value: import("react").ReactNode, valueClass?: string, hint?: string }} props
 */
export function StatBlock({ label, value, valueClass = "", hint }) {
  return (
    <div className={ui.statCard}>
      <p className={ui.label}>{label}</p>
      <p className={`${ui.statValue} ${valueClass}`.trim()}>{value}</p>
      {hint ? <p className={ui.statHint}>{hint}</p> : null}
    </div>
  );
}
