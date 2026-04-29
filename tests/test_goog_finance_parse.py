"""Tests for GOOGLEFINANCE cell parsing helpers."""

from __future__ import annotations

from datetime import date, datetime

import pytest

from common.goog_finance_parse import parse_close_session_date_cell, parse_instrument_name_cell


def test_parse_instrument_name_still_rejects_na() -> None:
    assert parse_instrument_name_cell("#N/A") is None
    assert parse_instrument_name_cell("Acme") == "Acme"


@pytest.mark.parametrize(
    "raw,expected",
    [
        (None, None),
        ("", None),
        ("N/A", None),
        ("#N/A", None),
        ("2026-04-28", date(2026, 4, 28)),
        ("2026/04/28", date(2026, 4, 28)),
        (datetime(2026, 4, 28, 15, 0, 0), date(2026, 4, 28)),
        (date(2026, 4, 28), date(2026, 4, 28)),
    ],
)
def test_parse_close_session_date_cell(raw: object, expected: date | None) -> None:
    assert parse_close_session_date_cell(raw) == expected
