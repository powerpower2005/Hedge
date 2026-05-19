from datetime import date

import pytest

from common.entry_lock import (
    build_pick_deferred,
    is_pending_entry,
    lock_entry_from_close,
)


def test_build_pick_deferred_shape():
    p = build_pick_deferred(1, "u", 10, "AAPL", "US", "NASDAQ", 0.2, 30)
    assert is_pending_entry(p)
    assert "price" not in p["entry"]
    assert p["entry"].get("pending") is True
    assert "price" not in p["target"]
    assert "deadline" not in p["duration"]
    assert p["extensions"]["entry_lock"] == "first_judgment_close"


def test_lock_entry_from_close():
    p = build_pick_deferred(2, "u", 11, "AAPL", "US", "NASDAQ", -0.15, 14)
    lock_entry_from_close(p, 100.0, date(2026, 5, 20), close_session_date=date(2026, 5, 20))
    assert not is_pending_entry(p)
    assert p["status"]["current"] == "active"
    assert p["entry"]["price"] == 100.0
    assert p["target"]["price"] == pytest.approx(85.0)
    assert p["duration"]["deadline"] == "2026-06-03"
    assert p["progress"]["current"]["return_rate"] == 0.0
