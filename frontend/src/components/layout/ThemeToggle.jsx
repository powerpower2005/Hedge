import { useTheme } from "../../hooks/useTheme.js";
import { useI18n } from "../../i18n/I18nContext.jsx";

export function ThemeToggle() {
  const { light, toggle } = useTheme();
  const { t } = useI18n();
  return (
    <button
      type="button"
      onClick={toggle}
      className="rounded-md border border-zinc-700 px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-800 light:border-zinc-300 light:text-zinc-800 light:hover:bg-zinc-100"
    >
      {light ? t("theme.dark") : t("theme.light")}
    </button>
  );
}
