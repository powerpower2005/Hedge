from datetime import date

from common.market_calendar import (
    advance_past_weekend_closed,
    expected_bar_through_date,
    is_weekend_closed,
    should_skip_daily_bars_sync,
    today_by_country,
)


def test_is_weekend_closed_kr():
    assert is_weekend_closed("KR", date(2026, 6, 27))  # Saturday
    assert is_weekend_closed("KR", date(2026, 6, 28))  # Sunday
    assert not is_weekend_closed("KR", date(2026, 6, 26))  # Friday


def test_should_skip_daily_bars_sync():
    assert should_skip_daily_bars_sync("KR", date(2026, 6, 27))
    assert not should_skip_daily_bars_sync("KR", date(2026, 6, 26))
    assert not should_skip_daily_bars_sync("JP", date(2026, 6, 27))


def test_today_by_country_returns_date():
    assert isinstance(today_by_country("KR"), date)


def test_expected_bar_through_date_weekend_rolls_to_friday():
    assert expected_bar_through_date("KR", date(2026, 6, 28)) == date(2026, 6, 26)
    assert expected_bar_through_date("KR", date(2026, 6, 27)) == date(2026, 6, 26)
    assert expected_bar_through_date("KR", date(2026, 6, 26)) == date(2026, 6, 26)


def test_advance_past_weekend_closed():
    assert advance_past_weekend_closed("KR", date(2026, 7, 11)) == date(2026, 7, 13)
    assert advance_past_weekend_closed("KR", date(2026, 7, 13)) == date(2026, 7, 13)
    assert advance_past_weekend_closed("KR", date(2026, 6, 26)) == date(2026, 6, 26)
