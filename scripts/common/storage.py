import json
from pathlib import Path
from typing import Any

from .versioning import build_generator_meta, now_iso

SCHEMA_VERSION = "1.0.0"


def load_list_file(path: Path) -> dict[str, Any]:
    if not path.exists():
        return _empty_list_file()
    return json.loads(path.read_text(encoding="utf-8"))


def save_list_file(path: Path, picks: list[dict]) -> None:
    payload = {
        "schema_version": SCHEMA_VERSION,
        "generator": build_generator_meta(),
        "generated_at": now_iso(),
        "data": {
            "count": len(picks),
            "picks": picks,
        },
    }
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def _empty_list_file() -> dict[str, Any]:
    return {
        "schema_version": SCHEMA_VERSION,
        "generator": build_generator_meta(),
        "generated_at": now_iso(),
        "data": {"count": 0, "picks": []},
    }


def get_picks(file_data: dict) -> list[dict]:
    return file_data.get("data", {}).get("picks", [])
