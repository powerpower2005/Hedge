const owner = (import.meta.env.VITE_REPO_OWNER ?? "").trim();
const repo = (import.meta.env.VITE_REPO_NAME ?? "").trim();
const branch = (import.meta.env.VITE_BRANCH ?? "main").trim();

export const IS_REPOSITORY_CONFIGURED = owner.length > 0 && repo.length > 0;

export const REPO_OWNER = owner;
export const REPO_NAME = repo;
export const BRANCH = branch;

const baseUrl = IS_REPOSITORY_CONFIGURED
  ? `https://raw.githubusercontent.com/${owner}/${repo}/${branch}`
  : "";

export const BASE_URL = baseUrl;

export const DATA_URLS = {
  active: `${baseUrl}/data/active.json`,
  hallOfFame: `${baseUrl}/data/hall_of_fame.json`,
  expired: `${baseUrl}/data/expired_recent.json`,
  version: `${baseUrl}/VERSION`,
  rules: `${baseUrl}/config/rules.current.json`,
};

export const NEW_PICK_URL = IS_REPOSITORY_CONFIGURED
  ? `https://github.com/${owner}/${repo}/issues/new?template=new_pick.yml`
  : "";

export const MARKETS = {
  US: ["NASDAQ", "NYSE"],
  KR: ["KOSPI", "KOSDAQ"],
};
