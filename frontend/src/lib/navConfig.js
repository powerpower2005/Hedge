/**
 * Primary nav: top-level groups + leaf routes.
 * @typedef {{ to: string, end?: boolean, labelKey: string }} NavLeaf
 * @typedef {{ id: string, labelKey: string, to?: string, end?: boolean, children?: NavLeaf[] }} NavEntry
 */

/** @type {NavEntry[]} */
export const PRIMARY_NAV = [
  {
    id: "picks",
    labelKey: "nav.groupPicks",
    children: [
      { to: "/", end: true, labelKey: "nav.dashboard" },
      { to: "/pending-entry", labelKey: "nav.pendingEntry" },
      { to: "/hall-of-fame", labelKey: "nav.hallOfFame" },
      { to: "/expired", labelKey: "nav.expired" },
    ],
  },
  {
    id: "ranking",
    labelKey: "nav.ranking",
    to: "/users",
  },
  {
    id: "info",
    labelKey: "nav.groupInfo",
    children: [
      { to: "/about", labelKey: "nav.about" },
      { to: "/guide", labelKey: "nav.guide" },
    ],
  },
];

/** @param {string} pathname */
export function pathnameMatchesLeaf(pathname, leaf) {
  if (leaf.end) return pathname === leaf.to;
  return pathname === leaf.to || pathname.startsWith(`${leaf.to}/`);
}

/** @param {string} pathname @param {NavLeaf[]} children */
export function isNavGroupActive(pathname, children) {
  return children.some((leaf) => pathnameMatchesLeaf(pathname, leaf));
}

/** User profile is under ranking section. */
export function isRankingSectionActive(pathname) {
  return pathname === "/users" || pathname.startsWith("/user/");
}
