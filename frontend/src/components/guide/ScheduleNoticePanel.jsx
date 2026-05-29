import { GuideSectionBody } from "./GuideSectionBody.jsx";
import { ScheduleLink } from "./ScheduleLink.jsx";
import { ui } from "../../lib/themeClasses.js";

/**
 * Callout linking to /guide#schedule. Pass one or more i18n paragraphs (may include **bold**).
 */
export function ScheduleNoticePanel({ paragraphs, className = "" }) {
  return (
    <aside className={`${ui.innerPanel} ${className}`.trim()}>
      <GuideSectionBody paragraphs={paragraphs} />
      <p className="mt-3 text-sm">
        <ScheduleLink />
      </p>
    </aside>
  );
}
