/**
 * @param {unknown} error
 * @param {(key: string, vars?: Record<string, string | number>) => string} t
 */
export function dataLoadErrorMessage(error, t) {
  if (import.meta.env.DEV && error != null) {
    return String(error?.message ?? error);
  }
  return t("errors.dataLoad");
}

/**
 * @param {{ code: "notfound" | "loadfailed"; dev?: string } | null} err
 * @param {(key: string, vars?: Record<string, string | number>) => string} t
 */
export function pickDetailErrorMessage(err, t) {
  if (!err) return "";
  if (err.code === "notfound") {
    return t("errors.pickNotFound");
  }
  if (err.code === "loadfailed") {
    if (import.meta.env.DEV && err.dev) return err.dev;
    return t("errors.pickLoad");
  }
  return t("errors.generic");
}
