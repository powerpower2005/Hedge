from common.register_public_messages import (
    GOOGLE_FINANCE_VERIFY_TIP,
    format_price_fetch_ops_log,
    format_price_fetch_public,
    scrub_machine_paths,
)


def test_format_price_fetch_public_user_shape():
    msg = format_price_fetch_public(
        ticker="ASTS",
        market="NASDAQ",
    )
    assert "ASTS" in msg
    assert "NASDAQ" in msg
    assert "google.com/finance" in msg.lower()
    assert "Actions" in msg
    assert "GOOGLEFINANCE(" not in msg
    assert "PriceLookup" not in msg
    assert "sheet" not in msg.lower()
    assert "시트" not in msg
    assert "spreadsheet" not in msg.lower()


def test_google_finance_verify_tip_nonempty():
    assert "google.com/finance" in GOOGLE_FINANCE_VERIFY_TIP.lower()


def test_format_price_fetch_public_user_with_fallback():
    msg = format_price_fetch_public(
        ticker="476830",
        market="KOSDAQ",
        tried_prefixes=["KOSDAQ", "KRX", "KOSPI"],
    )
    assert "476830" in msg
    assert "`KOSDAQ` → `KRX` → `KOSPI`" in msg
    assert "**EN:**" in msg
    assert "**한:**" in msg
    assert "Actions" in msg
    assert "GOOGLEFINANCE(" not in msg
    assert "시트" not in msg


def test_format_price_fetch_public_user_us_fallback():
    msg = format_price_fetch_public(
        ticker="SPY",
        market="NASDAQ",
        tried_prefixes=["NASDAQ", "NYSE", "NYSEARCA", "NYSEAMERICAN"],
    )
    assert "SPY" in msg
    assert "`NASDAQ` → `NYSE` → `NYSEARCA` → `NYSEAMERICAN`" in msg
    assert "Actions" in msg
    assert "시트" not in msg


def test_format_price_fetch_ops_log_contains_sheet_detail():
    msg = format_price_fetch_ops_log(
        ValueError("close not_ready last='N/A'"),
        ticker="ASTS",
        market="NASDAQ",
        row_index=5,
        last_raw="N/A",
        tried_prefixes=["NASDAQ", "NYSE", "NYSEARCA", "NYSEAMERICAN"],
        country="US",
    )
    assert "PriceLookup-v1" in msg
    assert "Row index" in msg
    assert "GOOGLEFINANCE" in msg
    assert "NYSEAMERICAN:ASTS" in msg


def test_scrub_paths_shortens():
    long = "/home/runner/work/foo/bar/baz" + "x" * 600
    out = scrub_machine_paths(long)
    assert "/home/runner/work/" not in out
    assert len(out) <= 520
