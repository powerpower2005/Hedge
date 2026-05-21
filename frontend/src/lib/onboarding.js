const KEY = "hedge-quick-guide-seen";

export function hasSeenQuickGuide() {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function markQuickGuideSeen() {
  try {
    localStorage.setItem(KEY, "1");
  } catch {
    /* ignore */
  }
}
