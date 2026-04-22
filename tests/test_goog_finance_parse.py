import pytest

from common.goog_finance_parse import parse_instrument_name_cell


@pytest.mark.parametrize(
    "raw,expected",
    [
        (None, None),
        ("", None),
        ("  ", None),
        ("N/A", None),
        ("#N/A", None),
        ("#VALUE!", None),
        ("Apple Inc", "Apple Inc"),
        ("삼성전자", "삼성전자"),
    ],
)
def test_parse_instrument_name_cell(raw, expected):
    assert parse_instrument_name_cell(raw) == expected


def test_parse_instrument_name_cell_truncates():
    long = "x" * 400
    out = parse_instrument_name_cell(long)
    assert out is not None
    assert len(out) == 280
