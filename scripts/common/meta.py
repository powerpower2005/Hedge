import json
from pathlib import Path
from typing import Any

from .versioning import now_iso

META_PATH = Path("data/meta.json")
SCHEMA_VERSION = "1.0.0"


def load_meta() -> dict[str, Any]:
    if not META_PATH.exists():
        return {"schema_version": SCHEMA_VERSION, "next_pick_id": 1}
    return json.loads(META_PATH.read_text(encoding="utf-8"))


def save_meta(meta: dict[str, Any]) -> None:
    META_PATH.parent.mkdir(parents=True, exist_ok=True)
    meta = dict(meta)
    meta.setdefault("schema_version", SCHEMA_VERSION)
    META_PATH.write_text(json.dumps(meta, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def peek_next_pick_id() -> int:
    return int(load_meta()["next_pick_id"])


def bump_next_pick_id(current_id: int) -> None:
    meta = load_meta()
    meta["next_pick_id"] = current_id + 1
    meta["updated_at"] = now_iso()
    save_meta(meta)


def touch_last_daily_judgment_at() -> None:
    """Record successful completion of daily_judgment (batch return / progress update)."""
    meta = load_meta()
    meta["last_daily_judgment_at"] = now_iso()
    save_meta(meta)
