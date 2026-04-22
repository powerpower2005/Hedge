from pathlib import Path

import pytest

from common.storage import get_picks, load_list_file, save_list_file
import operator_fix_pick as op


def _minimal_pick(pick_id: int, status: str = "active") -> dict:
    return {
        "id": pick_id,
        "schema_version": "1.0.0",
        "created_with": {"engine_version": "1.0.0", "rules_version": "1.0.0", "commit": ""},
        "created_at": "2026-01-01T00:00:00Z",
        "author": "u",
        "issue_number": 1,
        "ticker": "X",
        "country": "US",
        "market": "NYSE",
        "entry": {"price": 1.0, "date": "2026-01-01", "source": "x"},
        "target": {"return_rate": 0.1, "price": 1.1},
        "duration": {"days": 7, "deadline": "2026-01-08"},
        "status": {"current": status, "history": []},
        "progress": {
            "updated_at": "2026-01-01",
            "current": {"close": 1.0, "return_rate": 0.0},
            "highest": {"close": 1.0, "close_date": "2026-01-01", "return_rate": 0.0},
            "distance_to_target": 0.1,
            "error_count": 0,
        },
        "votes": {"likes": 0, "dislikes": 0, "last_synced": "2026-01-01T00:00:00Z"},
        "extensions": {},
    }


def test_remove_pick_from_active(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.chdir(tmp_path)
    monkeypatch.setenv("OPERATOR_DATA_ROOT", str(tmp_path))
    data_dir = tmp_path / "data"
    data_dir.mkdir()
    p = data_dir / "active.json"
    save_list_file(p, [_minimal_pick(7)])
    changed = op.remove_pick_from_lists(tmp_path, 7)
    assert len(changed) == 1
    assert get_picks(load_list_file(p)) == []


def test_remove_pick_from_hall_and_archive(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.chdir(tmp_path)
    monkeypatch.setenv("OPERATOR_DATA_ROOT", str(tmp_path))
    data_dir = tmp_path / "data"
    hall = data_dir / "hall_of_fame.json"
    arch_dir = data_dir / "archive"
    arch_dir.mkdir(parents=True)
    arch = arch_dir / "2026.json"
    save_list_file(hall, [_minimal_pick(1)])
    save_list_file(arch, [_minimal_pick(2), _minimal_pick(1)])
    changed = op.remove_pick_from_lists(tmp_path, 1)
    assert set(changed) == {hall, arch}
    assert len(get_picks(load_list_file(hall))) == 0
    assert [p["id"] for p in get_picks(load_list_file(arch))] == [2]


def test_delist_active(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.chdir(tmp_path)
    monkeypatch.setenv("OPERATOR_DATA_ROOT", str(tmp_path))
    data_dir = tmp_path / "data"
    data_dir.mkdir()
    p = data_dir / "active.json"
    save_list_file(p, [_minimal_pick(3, "active")])
    assert op.delist_pick_active(tmp_path, 3, "operator_test") is True
    picks = get_picks(load_list_file(p))
    assert picks[0]["status"]["current"] == "delisted"
    assert picks[0]["delisted_at"]
    assert any(h.get("reason") == "operator_test" for h in picks[0]["status"]["history"])


def test_remove_not_found_exits(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.chdir(tmp_path)
    monkeypatch.setenv("OPERATOR_DATA_ROOT", str(tmp_path))
    (tmp_path / "data").mkdir()
    save_list_file(tmp_path / "data" / "active.json", [_minimal_pick(99)])
    with pytest.raises(SystemExit) as ei:
        op.main(["--pick-id", "100", "--action", "remove", "--reason", "none"])
    assert ei.value.code == 1


def test_delist_wrong_status_exits(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.chdir(tmp_path)
    monkeypatch.setenv("OPERATOR_DATA_ROOT", str(tmp_path))
    (tmp_path / "data").mkdir()
    save_list_file(tmp_path / "data" / "active.json", [_minimal_pick(5, "achieved")])
    with pytest.raises(SystemExit) as ei:
        op.main(["--pick-id", "5", "--action", "delist", "--reason", "x"])
    assert ei.value.code == 2
