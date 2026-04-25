from dataclasses import dataclass, field, asdict
from enum import Enum
from typing import Any, Dict, List, Optional


class PickStatus(str, Enum):
    ACTIVE = "active"
    ACHIEVED = "achieved"
    EXPIRED = "expired"
    SUSPENDED = "suspended"
    DELISTED = "delisted"


class Country(str, Enum):
    US = "US"
    KR = "KR"


class Market(str, Enum):
    NASDAQ = "NASDAQ"
    NYSE = "NYSE"
    NYSEARCA = "NYSEARCA"
    NYSEAMERICAN = "NYSEAMERICAN"
    # US: Sheets GOOGLEFINANCE column C tries NASDAQ / NYSE / NYSEARCA / NYSEAMERICAN; see us_googlefinance_prefix_candidates.
    # Korea: Sheets GOOGLEFINANCE column C may use KRX, KOSPI, or KOSDAQ prefix; see kr_googlefinance_prefix_candidates.
    KRX = "KRX"
    KOSPI = "KOSPI"
    KOSDAQ = "KOSDAQ"


COUNTRY_MARKETS = {
    Country.US: {Market.NASDAQ, Market.NYSE, Market.NYSEARCA, Market.NYSEAMERICAN},
    Country.KR: {Market.KRX, Market.KOSPI, Market.KOSDAQ},
}


US_GOOGLEFINANCE_EXCHANGE_ORDER = ("NASDAQ", "NYSE", "NYSEARCA", "NYSEAMERICAN")


def market_for_google_finance(market: str) -> str:
    """Legacy single-prefix mapping (US unchanged; KR maps KOSPI/KOSDAQ → KRX).

    Registration uses us_googlefinance_prefix_candidates / kr_googlefinance_prefix_candidates.
    """
    if market in ("KOSPI", "KOSDAQ"):
        return "KRX"
    return market


def kr_googlefinance_prefix_candidates(form_market: str) -> list[str]:
    """Exchange prefixes to try for Sheets column C when country is KR (deduped).

    The form's board label is tried first, then the other two, so KOSDAQ-listed
    symbols that only resolve under ``KOSDAQ:`` are picked up before ``KRX:``.
    """
    m = (form_market or "").strip().upper()
    if m not in ("KRX", "KOSPI", "KOSDAQ"):
        m = "KRX"
    order = {
        "KOSDAQ": ["KOSDAQ", "KRX", "KOSPI"],
        "KOSPI": ["KOSPI", "KRX", "KOSDAQ"],
        "KRX": ["KRX", "KOSDAQ", "KOSPI"],
    }[m]
    seen: set[str] = set()
    out: list[str] = []
    for p in order:
        if p not in seen:
            seen.add(p)
            out.append(p)
    return out


def us_googlefinance_prefix_candidates(form_market: str) -> list[str]:
    """Exchange prefixes to try for Sheets column C when country is US (deduped).

    The form's exchange is tried first, then the other three in a fixed order.
    """
    m = (form_market or "").strip().upper()
    if m not in US_GOOGLEFINANCE_EXCHANGE_ORDER:
        m = "NASDAQ"
    rest = [x for x in US_GOOGLEFINANCE_EXCHANGE_ORDER if x != m]
    return [m, *rest]


def ticker_cell_for_price_lookup(ticker: str, country: str) -> str:
    """Cell value for column B so GOOGLEFINANCE(C:B) keeps leading zeros (KR tickers)."""
    if country == "KR":
        escaped = ticker.replace('"', '""')
        return f'="{escaped}"'
    return ticker


ALLOWED_DURATIONS = [7, 14, 30, 90, 180]
TARGET_RETURN_MIN = 0.10
TARGET_RETURN_MAX = 1.0
MAX_ACTIVE_PICKS_PER_USER = 10


@dataclass
class Pick:
    id: int
    schema_version: str
    created_with: Dict[str, str]
    created_at: str
    author: str
    issue_number: int
    ticker: str
    country: str
    market: str
    entry: Dict[str, Any]
    target: Dict[str, Any]
    duration: Dict[str, Any]
    status: Dict[str, Any]
    progress: Dict[str, Any] = field(default_factory=dict)
    votes: Dict[str, Any] = field(
        default_factory=lambda: {"likes": 0, "dislikes": 0}
    )
    achievement: Optional[Dict[str, Any]] = None
    extensions: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict:
        d = asdict(self)
        if self.achievement is None:
            d.pop("achievement", None)
        return d

    @classmethod
    def from_dict(cls, data: dict) -> "Pick":
        keys = cls.__dataclass_fields__.keys()
        return cls(**{k: v for k, v in data.items() if k in keys})
