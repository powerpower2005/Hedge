import { Link } from "react-router-dom";
import { PageLoading } from "../components/ui/PageLoading.jsx";
import { PickInstrumentHeading } from "../components/pick/PickInstrumentHeading.jsx";
import { PickDailyChart } from "../components/pick/PickDailyChart.jsx";
import { usePickById } from "../hooks/usePickById.js";
import { useI18n } from "../i18n/I18nContext.jsx";
import { getPickDisplayReturnRate } from "../lib/pickSignMismatch.js";
import { pickDetailErrorMessage } from "../lib/userMessages.js";
import { ui } from "../lib/themeClasses.js";

export function PickTradingHistoryPage() {
  const { t } = useI18n();
  const { pick, err, pickId } = usePickById();

  if (err && !pick) {
    return <p className={`${ui.page} text-red-400 light:text-red-600`}>{pickDetailErrorMessage(err, t)}</p>;
  }
  if (!pick) {
    return (
      <div className={ui.page}>
        <PageLoading />
      </div>
    );
  }

  const displayReturn = getPickDisplayReturnRate(pick);

  return (
    <article className={ui.page}>
      <nav className="mb-4">
        <Link to={`/pick/${pickId}`} className={`inline-flex items-center gap-1 text-sm ${ui.link}`}>
          <span aria-hidden>←</span> {t("pickHistoryChart.backToPick")}
        </Link>
      </nav>

      <header className={`${ui.card} ${ui.cardPad} mb-4`}>
        <PickInstrumentHeading
          pick={pick}
          variant="detail"
          currentReturnRate={displayReturn}
          className="min-w-0"
        />
      </header>

      <PickDailyChart pick={pick} mode="detail" />
    </article>
  );
}
