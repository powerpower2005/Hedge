from common.telegram_highlights import ReturnMove, big_move_picks, near_target_picks


def _active_pick(**overrides):
    base = {
        "id": 1,
        "country": "KR",
        "ticker": "005930",
        "author": "alice",
        "status": {"current": "active"},
        "target": {"return_rate": 0.1},
        "progress": {
            "distance_to_target": 0.05,
            "current": {"return_rate": 0.05},
        },
    }
    base.update(overrides)
    return base


def test_near_target_sorts_by_distance():
    far = _active_pick(id=1, progress={"distance_to_target": 0.2, "current": {"return_rate": 0.0}})
    near = _active_pick(id=2, progress={"distance_to_target": 0.02, "current": {"return_rate": 0.08}})
    result = near_target_picks([far, near], "KR", limit=5)
    assert [p["id"] for p in result] == [2, 1]


def test_near_target_skips_pending_and_other_country():
    pending = _active_pick(status={"current": "pending_entry"})
    us = _active_pick(country="US")
    result = near_target_picks([pending, us], "KR", limit=5)
    assert result == []


def test_big_move_sorts_by_absolute_delta():
    moves = [
        ReturnMove(_active_pick(id=1), 0.0, 0.01),
        ReturnMove(_active_pick(id=2), 0.0, 0.05),
        ReturnMove(_active_pick(id=3), 0.0, -0.03),
    ]
    top = big_move_picks(moves, limit=2)
    assert [m.pick["id"] for m in top] == [2, 3]
