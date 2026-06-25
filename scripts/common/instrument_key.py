"""Instrument identity for shared daily bar files."""

from __future__ import annotations

from pathlib import Path
from typing import Any

from .models import (
    hk_googlefinance_prefix_candidates,
    kr_googlefinance_prefix_candidates,
    us_googlefinance_prefix_candidates,
)

InstrumentKey = tuple[str, str, str]

BARS_ROOT = Path("data/bars/v1")
BARS_SUPPORTED_COUNTRIES = frozenset({"US", "KR", "HK"})


def instrument_key_from_pick(pick: dict[str, Any]) -> InstrumentKey | None:
    country = pick.get("country")
    market = pick.get("market")
    ticker = pick.get("ticker")
    if not country or not market or not ticker:
        return None
    return (str(country).upper(), str(market).upper(), str(ticker).upper())


def bars_file_path(key: InstrumentKey, *, root: Path | None = None) -> Path:
    country, market, ticker = key
    base = root or BARS_ROOT
    return base / country / market / f"{ticker}.json"


def finance_symbol(country: str, market: str, ticker: str) -> str:
    """Primary GOOGLEFINANCE symbol (exchange:ticker) from pick instrument fields."""
    return finance_symbol_candidates(country, market, ticker)[0]


def finance_symbol_candidates(country: str, market: str, ticker: str) -> list[str]:
    """Ordered GOOGLEFINANCE symbols to try (same prefix order as pick registration)."""
    c = country.upper()
    m = market.upper()
    t = ticker.upper()
    if c == "US":
        prefixes = us_googlefinance_prefix_candidates(m)
    elif c == "KR":
        prefixes = kr_googlefinance_prefix_candidates(m)
    elif c == "HK":
        prefixes = hk_googlefinance_prefix_candidates(m)
    else:
        raise ValueError(f"unsupported country for bars: {country}")
    return [f"{p}:{t}" for p in prefixes]
