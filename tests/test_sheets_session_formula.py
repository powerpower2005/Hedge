"""Sanity checks for PriceLookup session-date cell formula (no network)."""

from __future__ import annotations

from common.sheets import _SESSION_DATE_LOOKBACK_DAYS, _session_date_formula


def test_session_date_formula_order_and_depth() -> None:
    f = _session_date_formula(5)
    assert f.startswith("=")
    assert f.count("IFERROR") == _SESSION_DATE_LOOKBACK_DAYS
    assert "TODAY()-1" in f
    assert "TODAY()-14" in f
    assert f.index("TODAY()-1") < f.index("TODAY()-14")
