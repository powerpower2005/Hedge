import { useTheme } from "../../hooks/useTheme.js";

export function ThemeToggle() {
  const { light, toggle } = useTheme();
  return (
    <button
      type="button"
      onClick={toggle}
      className="rounded-md border border-zinc-700 px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-800 dark:border-zinc-300 dark:text-zinc-800 dark:hover:bg-zinc-100"
    >
      {light ? "Dark" : "Light"}
    </button>
  );
}
