import { useEffect, useState } from "react";

const KEY = "stock-challenge-theme";

export function useTheme() {
  const [light, setLight] = useState(() => {
    try {
      return localStorage.getItem(KEY) === "light";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (light) {
      root.classList.add("light");
    } else {
      root.classList.remove("light");
    }
    try {
      localStorage.setItem(KEY, light ? "light" : "dark");
    } catch {
      /* ignore */
    }
  }, [light]);

  return { light, setLight, toggle: () => setLight((v) => !v) };
}
