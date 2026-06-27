"""Market calendar helpers for daily judgment and bar sync."""

from __future__ import annotations

from datetime import date, datetime
from zoneinfo import ZoneInfo

COUNTRY_TIMEZONES = {
    "KR": "Asia/Seoul",
    "US": "America/New_York",
    "HK": "Asia/Hong_Kong",
    "JP": "Asia/Tokyo",
}

# v1: weekend closure for US/KR/HK GF bar sync (exchange holidays deferred).
WEEKEND_CLOSED_COUNTRIES = frozenset({"US", "KR", "HK"})


def today_by_country(country: str) -> date:
    tz_name = COUNTRY_TIMEZONES.get(country.upper())
    if tz_name is None:
        return datetime.now(ZoneInfo("UTC")).date()
    return datetime.now(ZoneInfo(tz_name)).date()


def is_weekend_closed(country: str, day: date) -> bool:
    """True when the country's market is routinely closed (Sat/Sun)."""
    if country.upper() not in WEEKEND_CLOSED_COUNTRIES:
        return False
    return day.weekday() >= 5


def should_skip_daily_bars_sync(country: str, day: date | None = None) -> bool:
    """Skip GF bar fetch on routine non-trading calendar days."""
    day = day or today_by_country(country)
    return is_weekend_closed(country, day)
