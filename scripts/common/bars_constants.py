"""Shared constants for daily bar sync, storage, and verification."""

from __future__ import annotations

from datetime import date, timedelta

DETAIL_TRADING_BARS = 250
DETAIL_LOOKBACK_CALENDAR_DAYS = 400


def detail_calendar_lookback_start(today: date) -> date:
    """Calendar start date wide enough to cover ~250 trading days."""
    return today - timedelta(days=DETAIL_LOOKBACK_CALENDAR_DAYS)
