import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DATA_URLS, IS_REPOSITORY_CONFIGURED, REPO_NAME, REPO_OWNER } from "../../lib/constants";

export function Footer() {
  const [version, setVersion] = useState("");
  const [rules, setRules] = useState(null);

  useEffect(() => {
    if (!IS_REPOSITORY_CONFIGURED) return undefined;
    fetch(DATA_URLS.version)
      .then((r) => {
        if (!r.ok) return null;
        return r.text();
      })
      .then((t) => {
        if (t != null) setVersion(t.trim());
      })
      .catch(() => {});
    fetch(DATA_URLS.rules)
      .then((r) => {
        if (!r.ok) return null;
        return r.json();
      })
      .then((j) => {
        if (j != null) setRules(j);
      })
      .catch(() => {});
    return undefined;
  }, []);

  return (
    <footer className="mt-16 border-t border-zinc-800 py-6 text-xs text-zinc-500 dark:border-zinc-200 dark:text-zinc-600">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4">
        <div>
          Stock Challenge
          {version && <span className="ml-2">v{version}</span>}
          {rules && <span className="ml-2">· Rules {rules.rules_version}</span>}
        </div>
        <div className="flex gap-4">
          <Link to="/about" className="hover:text-zinc-300 dark:hover:text-zinc-900">
            About
          </Link>
          {IS_REPOSITORY_CONFIGURED && (
            <a
              href={`https://github.com/${REPO_OWNER}/${REPO_NAME}`}
              className="hover:text-zinc-300 dark:hover:text-zinc-900"
            >
              GitHub
            </a>
          )}
        </div>
      </div>
    </footer>
  );
}
