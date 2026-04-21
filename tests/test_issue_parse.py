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
