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
    # Korea: GOOGLEFINANCE uses KRX:SYMBOL (not KOSPI:/KOSDAQ:).
    KRX = "KRX"


COUNTRY_MARKETS = {
    Country.US: {Market.NASDAQ, Market.NYSE},
    Country.KR: {Market.KRX},
}


def market_for_google_finance(market: str) -> str:
    """Prefix for GOOGLEFINANCE C:B (Korea must be KRX, not KOSPI/KOSDAQ)."""
    if market in ("KOSPI", "KOSDAQ"):
        return "KRX"
    return market


ALLOWED_DURATIONS = [7, 14, 30, 90, 180]
TARGET_RETURN_MIN = 0.03
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
