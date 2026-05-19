"""Deferred entry: lock official close on first daily judgment (rules >= 1.0.7)."""

from __future__ import annotations

from datetime import date, datetime, timedelta, timezone
from typing import Any

from .versioning import now_iso, read_engine_version

ENTRY_LOCK_FIRST_JUDGMENT = "first_judgment_close"
RULES_VERSION_DEFERRED_ENTRY = "1.0.7"

ACTIVE_LIKE_STATUSES = frozenset({"active", "pending_entry"})


def is_pending_entry(pick: dict[str, Any]) -> bool:
    return pick.get("status", {}).get("current") == "pending_entry"


def uses_deferred_entry_lock(pick: dict[str, Any]) -> bool:
    if is_pending_entry(pick):
        return True
    return pick.get("extensions", {}).get("entry_lock") == ENTRY_LOCK_FIRST_JUDGMENT


def build_pick_deferred(
    pick_id: int,
    author: str,
    issue_number: int,
    ticker: str,
    country: str,
    market: str,
    target_return: float,
    duration_days: int,
    *,
    instrument_name: str | None = None,
    author_note: str | None = None,
) -> dict[str, Any]:
    registered = datetime.now(timezone.utc).date()
    engine = read_engine_version()
    ts = now_iso()
    out: dict[str, Any] = {
        "id": pick_id,
        "schema_version": "1.0.0",
        "created_with": {
            "engine_version": engine,
            "rules_version": RULES_VERSION_DEFERRED_ENTRY,
        },
        "created_at": ts,
        "author": author,
        "issue_number": issue_number,
        "ticker": ticker,
        "country": country,
        "market": market,
        "entry": {
            "date": registered.isoformat(),
            "source": "google_sheets",
            "pending": True,
        },
        "target": {"return_rate": target_return},
        "duration": {"days": duration_days},
        "status": {
            "current": "pending_entry",
            "history": [
                {
                    "status": "pending_entry",
                    "at": ts,
                    "engine_version": engine,
                    "reason": "initial_registration",
                }
            ],
        },
        "progress": {"error_count": 0},
        "votes": {"likes": 0, "dislikes": 0, "last_synced": ts},
        "extensions": {"entry_lock": ENTRY_LOCK_FIRST_JUDGMENT},
    }
    if instrument_name:
        out["instrument_name"] = instrument_name
    if author_note:
        out["author_note"] = author_note
    return out


def lock_entry_from_close(
    pick: dict[str, Any],
    close: float,
    judgment_day: date,
    *,
    close_session_date: date | None = None,
) -> None:
    """Set entry/target/deadline/progress and move pending_entry → active."""
    target_return = float(pick["target"]["return_rate"])
    duration_days = int(pick["duration"]["days"])
    entry_price = float(close)
    session = close_session_date or judgment_day

    pick["entry"]["price"] = round(entry_price, 4)
    pick["entry"]["date"] = session.isoformat()
    pick["entry"]["source"] = "google_sheets"
    pick["entry"].pop("pending", None)
    if close_session_date is not None:
        pick["entry"]["close_session_date"] = close_session_date.isoformat()

    pick["target"]["price"] = round(entry_price * (1 + target_return), 4)
    pick["duration"]["deadline"] = (judgment_day + timedelta(days=duration_days)).isoformat()

    pick["progress"] = {
        "updated_at": judgment_day.isoformat(),
        "current": {"close": entry_price, "return_rate": 0.0},
        "highest": {
            "close": entry_price,
            "close_date": judgment_day.isoformat(),
            "return_rate": 0.0,
        },
        "lowest": {
            "close": entry_price,
            "close_date": judgment_day.isoformat(),
            "return_rate": 0.0,
        },
        "distance_to_target": abs(target_return),
        "error_count": 0,
    }

    engine = read_engine_version()
    ts = now_iso()
    pick["status"]["current"] = "active"
    pick["status"]["history"].append(
        {
            "status": "active",
            "at": ts,
            "engine_version": engine,
            "reason": "entry_locked_first_judgment_close",
        }
    )
