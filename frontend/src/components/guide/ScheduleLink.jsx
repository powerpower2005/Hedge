import { Link } from "react-router-dom";
import { useI18n } from "../../i18n/I18nContext.jsx";
import { ui } from "../../lib/themeClasses.js";

/** Link to the schedule section on the guide page. */
export function ScheduleLink({ className = "" }) {
  const { t } = useI18n();
  return (
    <Link to="/guide#schedule" className={`${ui.link} ${className}`.trim()}>
      {t("schedule.linkLabel")}
    </Link>
  );
}
