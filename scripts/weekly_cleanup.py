"""Expire old expired picks; move suspended -> delisted; drop old delisted."""

from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path

from common.storage import get_picks, load_list_file, save_list_file
from common.versioning import now_iso, read_engine_version

EXPIRED_PATH = Path("data/expired_recent.json")
ACTIVE_PATH = Path("data/active.json")

EXPIRED_RETENTION_DAYS = 30
SUSPENDED_TO_DELISTED_DAYS = 14
DELISTED_RETENTION_DAYS = 30


def days_since(iso_str: str) -> int:
    dt = datetime.fromisoformat(iso_str.replace("Z", "+00:00"))
    return (datetime.now(timezone.utc) - dt).days


def transition(pick: dict, new_status: str, reason: str) -> None:
    pick["status"]["current"] = new_status
    pick["status"]["history"].append(
        {
            "status": new_status,
            "at": now_iso(),
            "engine_version": read_engine_version(),
            "reason": reason,
        }
    )


def main() -> None:
    expired = get_picks(load_list_file(EXPIRED_PATH))
    kept_expired: list[dict] = []
    for p in expired:
        ea = p.get("expired_at")
        if not ea:
            kept_expired.append(p)
            continue
        if days_since(ea) < EXPIRED_RETENTION_DAYS:
            kept_expired.append(p)
    save_list_file(EXPIRED_PATH, kept_expired)

    active = get_picks(load_list_file(ACTIVE_PATH))
    still_active: list[dict] = []

    for p in active:
        status = p["status"]["current"]
        if status == "suspended":
            ref = p.get("suspended_at") or p["status"]["history"][-1]["at"]
            if days_since(ref) >= SUSPENDED_TO_DELISTED_DAYS:
                transition(p, "delisted", "suspended_too_long")
                p["delisted_at"] = now_iso()
                still_active.append(p)
            else:
                still_active.append(p)
        elif status == "delisted":
            ref = p.get("delisted_at")
            if not ref:
                still_active.append(p)
                continue
            if days_since(ref) >= DELISTED_RETENTION_DAYS:
                continue
            still_active.append(p)
        else:
            still_active.append(p)

    save_list_file(ACTIVE_PATH, still_active)
    print(f"Expired kept: {len(kept_expired)}, active: {len(still_active)}")


if __name__ == "__main__":
    main()
