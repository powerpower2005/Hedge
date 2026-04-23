const owner = (import.meta.env.VITE_REPO_OWNER ?? "").trim();
const repo = (import.meta.env.VITE_REPO_NAME ?? "").trim();
const branch = (import.meta.env.VITE_BRANCH ?? "main").trim();

export const IS_REPOSITORY_CONFIGURED = owner.length > 0 && repo.length > 0;

export const REPO_OWNER = owner;
export const REPO_NAME = repo;
export const BRANCH = branch;

export const NEW_PICK_URL = IS_REPOSITORY_CONFIGURED
  ? `https://github.com/${owner}/${repo}/issues/new?template=new_pick.yml`
  : "";

/** @param {number | string | undefined | null} issueNumber */
export function pickIssueUrl(issueNumber) {
  if (!IS_REPOSITORY_CONFIGURED || issueNumber == null || issueNumber === "") return "";
  const n = String(issueNumber).replace(/\D/g, "");
  if (!n) return "";
  return `https://github.com/${owner}/${repo}/issues/${n}`;
}

export const MARKETS = {
  US: ["NASDAQ", "NYSE", "NYSEARCA", "NYSEAMERICAN"],
  KR: ["KRX", "KOSPI", "KOSDAQ"],
};
