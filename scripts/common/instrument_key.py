"""Instrument identity for shared daily bar files."""

from __future__ import annotations

from pathlib import Path
from typing import Any

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
    """GOOGLEFINANCE symbol (exchange:ticker) from pick instrument fields."""
    c = country.upper()
    m = market.upper()
    t = ticker.upper()
    if c == "US":
        return f"{m}:{t}"
    if c == "HK":
        return f"HKG:{t}"
    if c == "KR":
        return f"{m}:{t}"
    raise ValueError(f"unsupported country for bars: {country}")
