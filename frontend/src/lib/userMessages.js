/**
 * User-facing copy: avoid exposing HTTP codes, URLs, or stack traces in production.
 */

export function dataLoadErrorMessage(error) {
  if (import.meta.env.DEV && error != null) {
    return String(error?.message ?? error);
  }
  return "Unable to load data. Please try again later.";
}

/**
 * @param {{ code: "notfound" | "loadfailed"; dev?: string } | null} err
 */
export function pickDetailErrorMessage(err) {
  if (!err) return "";
  if (err.code === "notfound") {
    return "No pick was found for this link.";
  }
  if (err.code === "loadfailed") {
    if (import.meta.env.DEV && err.dev) return err.dev;
    return "Unable to load this pick.";
  }
  return "Something went wrong.";
}
