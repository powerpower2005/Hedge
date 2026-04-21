import pytest

from common.validation import (
    ValidationError,
    validate_no_duplicate_ticker,
    validate_pick_input,
    validate_user_quota,
)


def test_validate_pick_ok():
    validate_pick_input("AAPL", "US", "NASDAQ", 0.1, 30)


def test_validate_pick_bad_market():
    with pytest.raises(ValidationError) as e:
        validate_pick_input("AAPL", "US", "KOSPI", 0.1, 30)
    assert e.value.code == "COUNTRY_MARKET_MISMATCH"


def test_validate_target_too_high():
    with pytest.raises(ValidationError) as e:
        validate_pick_input("AAPL", "US", "NASDAQ", 1.5, 30)
    assert e.value.code == "INVALID_TARGET_RETURN"


def test_validate_target_too_low():
    with pytest.raises(ValidationError) as e:
        validate_pick_input("AAPL", "US", "NASDAQ", 0.01, 30)
    assert e.value.code == "INVALID_TARGET_RETURN"


def test_validate_duration():
    with pytest.raises(ValidationError) as e:
        validate_pick_input("AAPL", "US", "NASDAQ", 0.1, 5)
    assert e.value.code == "INVALID_DURATION"


def test_validate_kr_ticker():
    validate_pick_input("005930", "KR", "KOSPI", 0.05, 90)


def test_quota():
    picks = [{"author": "u1", "status": {"current": "active"}}] * 10
    with pytest.raises(ValidationError) as e:
        validate_user_quota("u1", picks)
    assert e.value.code == "USER_QUOTA_EXCEEDED"


def test_duplicate_ticker():
    picks = [{"author": "u1", "status": {"current": "active"}, "ticker": "AAPL"}]
    with pytest.raises(ValidationError) as e:
        validate_no_duplicate_ticker("u1", "AAPL", picks)
    assert e.value.code == "DUPLICATE_TICKER"


def test_quota_other_user_ok():
    picks = [{"author": "u2", "status": {"current": "active"}}] * 10
    validate_user_quota("u1", picks)
