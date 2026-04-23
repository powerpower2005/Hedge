from pathlib import Path

from common.issue_pick_lookup import find_pick_by_issue_number
from common.storage import save_list_file


def test_find_pick_by_issue_number_found(tmp_path: Path) -> None:
    active = tmp_path / "active.json"
    save_list_file(active, [{"id": 7, "issue_number": 42, "status": {"current": "active"}}])
    found = find_pick_by_issue_number(42, list_paths=(active,))
    assert found is not None
    assert found["id"] == 7


def test_find_pick_by_issue_number_not_found(tmp_path: Path) -> None:
    active = tmp_path / "active.json"
    save_list_file(active, [{"id": 1, "issue_number": 1, "status": {"current": "active"}}])
    assert find_pick_by_issue_number(999, list_paths=(active,)) is None


def test_find_pick_scans_multiple_files(tmp_path: Path) -> None:
    active = tmp_path / "active.json"
    hall = tmp_path / "hall.json"
    save_list_file(active, [])
    save_list_file(hall, [{"id": 2, "issue_number": 50, "status": {"current": "achieved"}}])
    found = find_pick_by_issue_number(50, list_paths=(active, hall))
    assert found["id"] == 2
