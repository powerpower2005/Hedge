from common.bars_sheets import parse_googfinance_all_table


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
