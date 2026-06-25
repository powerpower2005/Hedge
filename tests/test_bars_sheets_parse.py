from datetime import date
from unittest.mock import patch

from common.bars_errors import BarsFetchError
from common.bars_sheets import fetch_bars_with_symbol_candidates, parse_googfinance_all_table


def test_parse_googfinance_all_table_with_header():
    rows = [
        ["Date", "Open", "High", "Low", "Close", "Volume"],
        ["2026-04-23", 180.1, 182.0, 178.5, 181.2, 12345678],
        ["2026-04-24", 181.0, 183.0, 180.0, 182.5, 9876543],
    ]
    bars = parse_googfinance_all_table(rows)
    assert len(bars) == 2
    assert bars[0]["date"] == "2026-04-23"
    assert bars[0]["close"] == 181.2
    assert bars[0]["volume"] == 12345678


def test_parse_googfinance_all_table_missing_volume():
    rows = [["2026-04-23", 180.1, 182.0, 178.5, 181.2, "N/A"]]
    bars = parse_googfinance_all_table(rows)
    assert len(bars) == 1
    assert "volume" not in bars[0]


def test_parse_googfinance_all_table_skips_bad_rows():
    rows = [
        ["not-a-date", 1, 2, 3, 4, 5],
        ["2026-04-23", 180.1, 182.0, 178.5, 181.2, 100],
    ]
    bars = parse_googfinance_all_table(rows)
    assert len(bars) == 1


def test_fetch_bars_with_symbol_candidates_falls_back():
    start = date(2026, 5, 31)
    end = date(2026, 6, 25)
    sample = [{"date": "2026-06-01", "open": 1, "high": 2, "low": 0.5, "close": 1.5}]

    def fake_fetch(symbol: str, s: date, e: date):
        if symbol == "KOSPI:000150":
            raise BarsFetchError(
                phase="googfinance_empty",
                symbol=symbol,
                start=s,
                end=e,
                message="N/A",
            )
        if symbol == "KRX:000150":
            return sample
        raise AssertionError(f"unexpected symbol {symbol}")

    with patch("common.bars_sheets.fetch_bars_google_finance", side_effect=fake_fetch):
        used, bars = fetch_bars_with_symbol_candidates(
            ["KOSPI:000150", "KRX:000150", "KOSDAQ:000150"],
            start,
            end,
        )
    assert used == "KRX:000150"
    assert bars == sample
