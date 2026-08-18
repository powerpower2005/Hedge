"""Market calendar helpers for daily judgment and bar sync."""

from __future__ import annotations

from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo

COUNTRY_TIMEZONES = {
    "KR": "Asia/Seoul",
    "US": "America/New_York",
    "HK": "Asia/Hong_Kong",
    "JP": "Asia/Tokyo",
}

# US/HK exchange holidays still deferred; KR weekday closures below (KRX).
WEEKEND_CLOSED_COUNTRIES = frozenset({"US", "KR", "HK"})

# Non-weekend KRX closed days (statutory + substitute + known one-offs).
# Weekends are handled separately via is_weekend_closed.
# Keep ~2 years ahead so daily GF sync does not start on a holiday.
KR_EXCHANGE_HOLIDAYS = frozenset(
    {
        # 2025 (KRX published weekday closures)
        date(2025, 1, 1),
        date(2025, 1, 27),
        date(2025, 1, 28),
        date(2025, 1, 29),
        date(2025, 1, 30),
        date(2025, 3, 3),
        date(2025, 5, 1),
        date(2025, 5, 5),
        date(2025, 5, 6),
        date(2025, 6, 6),
        date(2025, 8, 15),
        date(2025, 10, 3),
        date(2025, 10, 6),
        date(2025, 10, 7),
        date(2025, 10, 8),
        date(2025, 10, 9),
        date(2025, 12, 25),
        date(2025, 12, 31),
        # 2026
        date(2026, 1, 1),
        date(2026, 2, 16),
        date(2026, 2, 17),
        date(2026, 2, 18),
        date(2026, 3, 2),  # Independence Day (Mar 1 Sun) substitute
        date(2026, 5, 1),
        date(2026, 5, 5),
        date(2026, 5, 25),  # Buddha's Birthday (May 24 Sun) substitute
        date(2026, 6, 3),  # local election
        date(2026, 8, 17),  # Liberation Day (Aug 15 Sat) substitute
        date(2026, 9, 24),
        date(2026, 9, 25),
        date(2026, 9, 28),  # Chuseok (Sep 26 Sat) substitute
        date(2026, 10, 5),  # National Foundation Day (Oct 3 Sat) substitute
        date(2026, 10, 9),
        date(2026, 12, 25),
        date(2026, 12, 31),  # typical year-end close (confirm annually)
        # 2027 fixed-date / substitute only (lunar windows added when published)
        date(2027, 1, 1),
        date(2027, 3, 1),
        date(2027, 5, 1),
        date(2027, 5, 5),
        date(2027, 6, 6),
        date(2027, 8, 16),  # Liberation Day (Aug 15 Sun) substitute
        date(2027, 10, 4),  # National Foundation Day (Oct 3 Sun) substitute
        date(2027, 10, 9),
        date(2027, 10, 11),  # Hangul Day (Oct 9 Sat) substitute
        date(2027, 12, 27),  # Christmas (Dec 25 Sat) substitute
    }
)


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


def is_exchange_holiday(country: str, day: date) -> bool:
    """True on curated weekday exchange holidays (KR only in v1)."""
    if country.upper() == "KR":
        return day in KR_EXCHANGE_HOLIDAYS
    return False


def is_market_closed(country: str, day: date) -> bool:
    """True when bars sync should treat the calendar day as non-trading."""
    return is_weekend_closed(country, day) or is_exchange_holiday(country, day)


def should_skip_daily_bars_sync(country: str, day: date | None = None) -> bool:
    """Skip GF bar fetch on weekends / known exchange holidays."""
    day = day or today_by_country(country)
    return is_market_closed(country, day)


def expected_bar_through_date(country: str, day: date) -> date:
    """Last calendar date daily bars should cover through (skip closed days)."""
    expected = day
    while is_market_closed(country, expected):
        expected -= timedelta(days=1)
    return expected


def advance_past_weekend_closed(country: str, day: date) -> date:
    """Move forward across weekends/holidays so GF fetch ranges start on a trading day."""
    while is_market_closed(country, day):
        day += timedelta(days=1)
    return day
