export default {
  app: { title: "Stock Challenge", documentTitle: "Stock Challenge" },
  nav: {
    active: "Active",
    hallOfFame: "Hall of Fame",
    expired: "Expired",
    about: "About",
    guide: "Guide",
    newPick: "New pick",
  },
  lang: { label: "Language", ko: "한국어", en: "English" },
  theme: { light: "Light", dark: "Dark" },
  common: {
    loading: "Loading…",
    home: "Home",
    backToList: "Back to list",
    all: "All",
  },
  errors: {
    dataLoad: "Unable to load data. Please try again later.",
    pickLoad: "Unable to load this pick.",
    pickNotFound: "No pick was found for this link.",
    generic: "Something went wrong.",
  },
  active: {
    title: "Active picks",
    subtitle: "{count} open challenges (cached ~1 min).",
  },
  hallOfFame: {
    title: "Hall of Fame",
    subtitle: "Picks that reached their target.",
  },
  expired: {
    title: "Expired picks",
    subtitle: "Picks that did not reach the target before the deadline.",
  },
  guide: {
    documentTitle: "Guide | Stock Challenge",
    title: "Guide",
    lead: "Follow these steps if you are new or unsure how things work.",
    s1Title: "Browse lists and details",
    s1Body:
      "Use the top tabs: Active, Hall of Fame, and Expired. Click a card to open its detail page. Click an @username on a card to see that participant’s picks only. Use filters and sort to narrow the list.",
    s2Title: "Submit a new pick",
    s2Body:
      "While signed in, click New pick in the header to open the registration form. Enter ticker, country & market, target return (%), and duration (days). US names pair with NASDAQ/NYSE; KR with KOSPI/KOSDAQ. Tickers are alphanumeric only. After submission, checks run automatically; if accepted, the pick appears under Active.",
    s3Title: "Limits and rules",
    s3Body:
      "There are caps on how many active picks you may have at once and on duplicate tickers per user. Target return and duration must be chosen from the allowed ranges shown on the form. If something is wrong, a message may appear on the same submission thread.",
    s4Title: "Progress and outcomes",
    s4Body:
      "Picks are refreshed daily using official closing levels. If the target is reached in time, the pick moves to Hall of Fame; otherwise it moves to Expired after the deadline. The detail page shows entry, targets, and current return.",
    s5Title: "Votes (reactions)",
    s5Body:
      "Reactions left on the thread linked to a pick may be aggregated. The numbers on cards reflect that tally when available.",
    s6Title: "Display settings",
    s6Body:
      "Use the language control for Korean or English, and the theme toggle for light or dark. Choices are saved in this browser.",
  },
  about: {
    documentTitle: "About | Stock Challenge",
    title: "About",
    lead:
      "Stock Challenge is a community event: you choose a ticker, a target return, and a time window. Registered picks appear in public lists, and progress is updated daily using official closing prices.",
    bullet1: "Judgment: if the daily close touches the target price within the window, the pick is marked achieved.",
    bullet2: "Submissions use a fixed form; entries that break the rules may be rejected.",
    bullet3: "No unofficial price scraping; only published closing references are used.",
    rulesLoaded: "Rules version {version} (effective {from}).",
  },
  pickDetail: {
    refLine: "Ref #{n}",
    entry: "Entry",
    targetReturn: "Target return",
    targetPrice: "Target price",
    deadline: "Deadline",
    currentReturn: "Current return",
    achieved: "Achieved",
    achievedMeta: "Date {date} · Days {days} · Final {final}",
  },
  user: {
    title: "@{name}",
    totalPicks: "Total picks",
    achieved: "Achieved",
    avgTarget: "Avg target return",
    allPicks: "All picks",
  },
  pickCard: {
    target: "Target",
    deadline: "Deadline",
    entry: "Entry",
    progress: "Progress",
    votes: "Votes",
  },
  pickList: { empty: "No picks yet." },
  filters: {
    country: "Country",
    market: "Market",
    tickerContains: "Ticker contains",
    sort: "Sort",
    sortLatest: "Latest",
    sortMostVoted: "Most voted",
    sortDeadlineSoon: "Deadline soon",
    sortCurrentReturn: "Current return",
    sortNearTarget: "Nearest to target",
  },
  status: {
    active: "Active",
    achieved: "Achieved",
    expired: "Expired",
    suspended: "Suspended",
    delisted: "Delisted",
  },
  footer: {
    about: "About",
    guide: "Guide",
    rulesLine: "· Rules {version}",
  },
};
