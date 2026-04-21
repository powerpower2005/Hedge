import json
from pathlib import Path

from common.storage import get_picks, load_list_file, save_list_file


def test_save_roundtrip(tmp_path: Path):
    p = tmp_path / "active.json"
    picks = [
        {
            "id": 1,
            "schema_version": "1.0.0",
            "created_with": {"engine_version": "1.0.0", "rules_version": "1.0.0"},
            "created_at": "2026-01-01T00:00:00Z",
            "author": "a",
            "issue_number": 1,
            "ticker": "A",
            "country": "US",
            "market": "NYSE",
            "entry": {"price": 1.0, "date": "2026-01-01", "source": "x"},
            "target": {"return_rate": 0.1, "price": 1.1},
            "duration": {"days": 7, "deadline": "2026-01-08"},
            "status": {"current": "active", "history": []},
        }
    ]
    save_list_file(p, picks)
    data = json.loads(p.read_text(encoding="utf-8"))
    assert data["data"]["count"] == 1
    assert get_picks(data)[0]["ticker"] == "A"


def test_load_missing_returns_empty(tmp_path: Path):
    p = tmp_path / "missing.json"
    d = load_list_file(p)
    assert get_picks(d) == []
