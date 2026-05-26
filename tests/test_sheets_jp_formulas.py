"""Sanity checks for PriceLookup-jp-v1 cell formulas (no network)."""

from __future__ import annotations

from common.sheets import _jp_close_formula, _jp_session_date_formula


def test_jp_close_formula_uses_yahoof() -> None:
    f = _jp_close_formula(3)
    assert f.startswith("=")
    assert "yahooF(B3" in f
    assert "previousClose" in f
    assert "ISNUMBER" in f
    assert "GOOGLEFINANCE" in f
    assert "TYO:" in f
    assert "REGEXREPLACE" in f


def test_jp_session_date_formula() -> None:
    f = _jp_session_date_formula(5)
    assert "D5" in f
    assert "TODAY()-1" in f
