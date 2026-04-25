import pytest

from common.issue_parse import normalized_fields, parse_issue_form

SAMPLE = """
### Ticker

AAPL

### Country

US

### Market

NASDAQ

### Target return (%)

10

### Duration (days)

30
"""


def test_parse_issue_form_basic():
    raw = parse_issue_form(SAMPLE)
    assert raw.get("ticker") == "AAPL"
    assert raw.get("country") == "US"
    fields = normalized_fields(raw)
    assert fields["ticker"] == "AAPL"
    assert fields["target_return"] == pytest.approx(0.1)
    assert fields["duration_days"] == 30


def test_parse_markdown_bold_duration():
    body = """
### Duration (days)

**90**
"""
    raw = parse_issue_form(body)
    fields = normalized_fields(
        {
            "ticker": "X",
            "country": "US",
            "market": "NYSE",
            "target_return_pct": "5",
            **raw,
        }
    )
    assert fields["duration_days"] == 90


def test_parse_empty():
    assert parse_issue_form("") == {}


def test_kr_market_kospi_preserved():
    raw = {
        "ticker": "005930",
        "country": "KR",
        "market": "KOSPI",
        "target_return_pct": "10",
        "duration_days": "30",
    }
    fields = normalized_fields(raw)
    assert fields["market"] == "KOSPI"


def test_kr_kosdaq_preserved():
    raw = {
        "ticker": "035420",
        "country": "KR",
        "market": "KOSDAQ",
        "target_return_pct": "5",
        "duration_days": "90",
    }
    assert normalized_fields(raw)["market"] == "KOSDAQ"


def test_author_note_multiline():
    body = (
        SAMPLE.strip()
        + "\n\n### Additional note (optional) / 추가 메모 (선택)\n\n"
        + "first line\n"
        + "second line\n"
    )
    raw = parse_issue_form(body)
    assert raw.get("author_note") == "first line\nsecond line"
    fields = normalized_fields(raw)
    assert fields["author_note"] == "first line\nsecond line"


def test_author_note_absent_omits_key():
    fields = normalized_fields(parse_issue_form(SAMPLE))
    assert "author_note" not in fields
