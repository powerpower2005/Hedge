from datetime import date

from daily_judgment import snapshot_expiry_close, update_progress


def test_snapshot_expiry_close_captures_pre_update_progress():
    pick = {
        "duration": {"deadline": "2026-04-29"},
        "entry": {"price": 100.0},
        "target": {"price": 110.0, "return_rate": 0.1},
        "progress": {
            "updated_at": "2026-04-29",
            "current": {"close": 105.0, "return_rate": 0.05},
            "highest": {"close": 105.0, "close_date": "2026-04-29", "return_rate": 0.05},
        },
    }
    snapshot_expiry_close(pick)
    assert pick["expiry"]["close"] == 105.0
    assert pick["expiry"]["session_date"] == "2026-04-29"
    assert pick["expiry"]["return_rate"] == 0.05

    update_progress(pick, 108.0, date(2026, 5, 1))
    assert pick["progress"]["current"]["close"] == 108.0
    assert pick["expiry"]["close"] == 105.0
