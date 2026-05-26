"""Yahoo chart API for JP rows (registration refresh + name). Same source as sheets_jp_yahoo.gs."""

from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import date, timedelta
from typing import Any
from urllib.error import URLError
from urllib.request import Request, urlopen
from zoneinfo import ZoneInfo

_USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36"
)
_NAME_MAX_LEN = 280
_TOKYO = ZoneInfo("Asia/Tokyo")


@dataclass(frozen=True)
class JpQuote:
    previous_close: float
    name: str | None
    session_date: str  # yyyy-mm-dd, prior Tokyo calendar day


def fetch_jp_instrument_name(yahoo_ticker: str) -> str | None:
    quote = fetch_jp_quote(yahoo_ticker)
    return quote.name if quote else None


def fetch_jp_quote(yahoo_ticker: str) -> JpQuote | None:
    """One Yahoo chart request: previous close + name (equivalent to refreshJpRow)."""
    meta = _fetch_meta(yahoo_ticker)
    if meta is None:
        return None
    price = meta.get("previousClose")
    if price is None:
        price = meta.get("chartPreviousClose")
    try:
        close = float(price)
    except (TypeError, ValueError):
        return None
    if close != close:  # NaN
        return None
    name: str | None = None
    raw_name = meta.get("longName") or meta.get("shortName")
    if raw_name is not None:
        s = str(raw_name).strip()
        if s:
            name = s[:_NAME_MAX_LEN] if len(s) > _NAME_MAX_LEN else s
    session = (datetime_now_tokyo().date() - timedelta(days=1)).isoformat()
    return JpQuote(previous_close=close, name=name, session_date=session)


def datetime_now_tokyo():
    from datetime import datetime

    return datetime.now(_TOKYO)


def _fetch_meta(yahoo_ticker: str) -> dict[str, Any] | None:
    ticker = (yahoo_ticker or "").strip()
    if not ticker:
        return None
    url = f"https://query1.finance.yahoo.com/v8/finance/chart/{ticker}"
    try:
        req = Request(url, headers={"User-Agent": _USER_AGENT})
        with urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode("utf-8", errors="replace"))
    except (URLError, OSError, ValueError, KeyError, IndexError):
        return None
    results = (data.get("chart") or {}).get("result") or []
    if not results:
        return None
    meta = results[0].get("meta")
    return meta if isinstance(meta, dict) else None
