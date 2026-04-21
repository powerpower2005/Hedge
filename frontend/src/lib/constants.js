const owner = import.meta.env.VITE_REPO_OWNER || "YOUR_GITHUB_USERNAME";
const repo = import.meta.env.VITE_REPO_NAME || "stock-challenge";
const branch = import.meta.env.VITE_BRANCH || "main";

export const REPO_OWNER = owner;
export const REPO_NAME = repo;
export const BRANCH = branch;

export const BASE_URL = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}`;

export const DATA_URLS = {
  active: `${BASE_URL}/data/active.json`,
  hallOfFame: `${BASE_URL}/data/hall_of_fame.json`,
  expired: `${BASE_URL}/data/expired_recent.json`,
  version: `${BASE_URL}/VERSION`,
  rules: `${BASE_URL}/config/rules.current.json`,
};

export const NEW_PICK_URL = `https://github.com/${owner}/${repo}/issues/new?template=new_pick.yml`;

export const MARKETS = {
  US: ["NASDAQ", "NYSE"],
  KR: ["KOSPI", "KOSDAQ"],
};
