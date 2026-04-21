import { DATA_URLS } from "../lib/constants";
import { useEffect, useState } from "react";

export function AboutPage() {
  const [rules, setRules] = useState(null);

  useEffect(() => {
    fetch(DATA_URLS.rules)
      .then((r) => r.json())
      .then(setRules)
      .catch(() => {});
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold text-white dark:text-zinc-900">About</h1>
      <p className="mt-4 text-zinc-300 dark:text-zinc-700">
        Stock Challenge is a serverless experiment: picks are stored as JSON in GitHub, prices come from
        Google Sheets using <code className="text-emerald-400">GOOGLEFINANCE</code> (close), and judgment
        runs once per day via Actions.
      </p>
      <ul className="mt-4 list-disc space-y-2 pl-5 text-zinc-300 dark:text-zinc-700">
        <li>Touch rule: if daily close reaches the target price within the window, the pick is achieved.</li>
        <li>Registration uses GitHub Issue forms; the workflow validates and writes data.</li>
        <li>No scraping; no server beyond GitHub and Google APIs.</li>
      </ul>
      {rules && (
        <p className="mt-4 text-sm text-zinc-500">
          Loaded rules version <strong>{rules.rules_version}</strong> effective {rules.effective_from}.
        </p>
      )}
    </div>
  );
}
