"""Sanity checks for PriceLookup column D close formula (no network)."""

from __future__ import annotations

from common.sheets import _CLOSE_PRICE_LOOKBACK_DAYS, _close_price_formula


def test_close_price_formula_sorted_history_row2() -> None:
    f = _close_price_formula(5)
    assert f.startswith("=")
    assert "GOOGLEFINANCE" in f
    assert '"close"' in f
    assert "SORT(" in f
    assert f"TODAY()-{_CLOSE_PRICE_LOOKBACK_DAYS}" in f
    assert _CLOSE_PRICE_LOOKBACK_DAYS == 7
    assert "closeyest" not in f
    assert ",2,2)" in f or ";2;2)" in f
