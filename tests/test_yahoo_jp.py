"""JP Yahoo name helper (network optional)."""

from __future__ import annotations

from common.yahoo_jp import fetch_jp_instrument_name, fetch_jp_quote


def test_fetch_jp_instrument_name_7012() -> None:
    name = fetch_jp_instrument_name("7012.T")
    assert name
    assert "Kawasaki" in name or "KAWASAKI" in name.upper()


def test_fetch_jp_quote_7012() -> None:
    q = fetch_jp_quote("7012.T")
    assert q is not None
    assert q.previous_close > 0
    assert q.name
    assert len(q.session_date) == 10
