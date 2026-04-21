import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  if (mode === "production") {
    const o = (env.VITE_REPO_OWNER ?? "").trim();
    const r = (env.VITE_REPO_NAME ?? "").trim();
    if (!o || !r) {
      throw new Error(
        "Production build requires VITE_REPO_OWNER and VITE_REPO_NAME (set in CI or frontend/.env).",
      );
    }
  }
  const base = env.VITE_BASE || "/";
  return {
    base,
    plugins: [react()],
  };
});
