import { ui } from "../../lib/themeClasses.js";

/**
 * @param {{ label: string, children: import("react").ReactNode, valueClass?: string }} props
 */
export function MetricBlock({ label, children, valueClass = "" }) {
  return (
    <div className={ui.metricBlock}>
      <p className={ui.label}>{label}</p>
      <div className={`${ui.metricValue} ${valueClass}`.trim()}>{children}</div>
    </div>
  );
}
