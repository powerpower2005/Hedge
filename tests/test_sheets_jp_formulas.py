"""Sanity checks for PriceLookup-jp-v1 (no network)."""

from __future__ import annotations

from common.sheets import JP_CLOSE_PENDING, _jp_session_date_formula


def test_jp_close_pending_marker() -> None:
    assert JP_CLOSE_PENDING == "PENDING"


def test_jp_session_date_formula() -> None:
    f = _jp_session_date_formula(5)
    assert "D5" in f
    assert "TODAY()-1" in f
    assert "ISNUMBER" in f
