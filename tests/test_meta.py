import json
from pathlib import Path

from common.meta import bump_next_pick_id, load_meta, peek_next_pick_id, touch_last_daily_judgment_at


def test_meta_bump(tmp_path: Path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    d = tmp_path / "data"
    d.mkdir()
    meta_path = d / "meta.json"
    meta_path.write_text(
        json.dumps({"schema_version": "1.0.0", "next_pick_id": 1}), encoding="utf-8"
    )
    assert peek_next_pick_id() == 1
    bump_next_pick_id(1)
    m = load_meta()
    assert m["next_pick_id"] == 2


def test_touch_last_daily_judgment_at(tmp_path: Path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    d = tmp_path / "data"
    d.mkdir()
    meta_path = d / "meta.json"
    meta_path.write_text(
        json.dumps({"schema_version": "1.0.0", "next_pick_id": 5}), encoding="utf-8"
    )
    touch_last_daily_judgment_at()
    m = load_meta()
    assert m["next_pick_id"] == 5
    assert "last_daily_judgment_at" in m
    assert isinstance(m["last_daily_judgment_at"], str)
    assert len(m["last_daily_judgment_at"]) >= 10
