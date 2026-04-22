import pytest

from common.models import market_for_google_finance, ticker_cell_for_price_lookup
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
        validate_pick_input("AAPL", "US", "KRX", 0.1, 30)
    assert e.value.code == "COUNTRY_MARKET_MISMATCH"


def test_validate_target_too_high():
    with pytest.raises(ValidationError) as e:
        validate_pick_input("AAPL", "US", "NASDAQ", 1.5, 30)
    assert e.value.code == "INVALID_TARGET_RETURN"


def test_validate_target_too_low():
    with pytest.raises(ValidationError) as e:
        validate_pick_input("AAPL", "US", "NASDAQ", 0.01, 30)
    assert e.value.code == "INVALID_TARGET_RETURN"


def test_validate_target_below_ten_percent():
    with pytest.raises(ValidationError) as e:
        validate_pick_input("AAPL", "US", "NASDAQ", 0.09, 30)
    assert e.value.code == "INVALID_TARGET_RETURN"


def test_validate_duration():
    with pytest.raises(ValidationError) as e:
        validate_pick_input("AAPL", "US", "NASDAQ", 0.1, 5)
    assert e.value.code == "INVALID_DURATION"


def test_validate_kr_ticker():
    validate_pick_input("005930", "KR", "KRX", 0.12, 90)


def test_market_for_google_finance_korea_legacy():
    assert market_for_google_finance("KOSPI") == "KRX"
    assert market_for_google_finance("KOSDAQ") == "KRX"
    assert market_for_google_finance("KRX") == "KRX"
    assert market_for_google_finance("NASDAQ") == "NASDAQ"


def test_ticker_cell_for_price_lookup_kr_formula_preserves_zeros():
    assert ticker_cell_for_price_lookup("005930", "KR") == '="005930"'
    assert ticker_cell_for_price_lookup("035420", "KR") == '="035420"'


def test_ticker_cell_for_price_lookup_us_plain():
    assert ticker_cell_for_price_lookup("AAPL", "US") == "AAPL"


def test_ticker_cell_for_price_lookup_kr_escapes_quotes():
    assert ticker_cell_for_price_lookup('X"Y', "KR") == '="X""Y"'


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
