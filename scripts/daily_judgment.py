"""Daily batch: update closes, achieve, expire, suspend."""

from __future__ import annotations

import sys
from datetime import date, datetime, timezone
from pathlib import Path

from common.sheets import fetch_all_prices_rows
from common.storage import get_picks, load_list_file, save_list_file
from common.versioning import now_iso, read_engine_version

ACTIVE_PATH = Path("data/active.json")
HALL_PATH = Path("data/hall_of_fame.json")
EXPIRED_PATH = Path("data/expired_recent.json")
ARCHIVE_DIR = Path("data/archive")

HALL_OF_FAME_SIZE = 100
SUSPENDED_THRESHOLD = 5


def today_utc() -> date:
    return datetime.now(timezone.utc).date()


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


def update_progress(pick: dict, close: float) -> None:
    entry_price = pick["entry"]["price"]
    target_price = pick["target"]["price"]
    return_rate = (close - entry_price) / entry_price

    pick["progress"]["updated_at"] = today_utc().isoformat()
    pick["progress"]["current"] = {
        "close": close,
        "return_rate": round(return_rate, 6),
    }

    highest = pick["progress"]["highest"]
    if close > highest["close"]:
        pick["progress"]["highest"] = {
            "close": close,
            "close_date": today_utc().isoformat(),
            "return_rate": round(return_rate, 6),
        }

    pick["progress"]["distance_to_target"] = round(
        (target_price - pick["progress"]["highest"]["close"]) / entry_price,
        6,
    )
    pick["progress"]["error_count"] = 0


def handle_error(pick: dict) -> None:
    pick["progress"]["error_count"] = pick["progress"].get("error_count", 0) + 1
    if pick["progress"]["error_count"] >= SUSPENDED_THRESHOLD:
        if pick["status"]["current"] != "suspended":
            transition(pick, "suspended", "consecutive_price_fetch_errors")
            pick["suspended_at"] = now_iso()


def slide_hall_of_fame(hall_picks: list[dict]) -> tuple[list[dict], list[dict]]:
    if len(hall_picks) <= HALL_OF_FAME_SIZE:
        return hall_picks, []
    hall_picks = sorted(
        hall_picks,
        key=lambda p: p.get("achievement", {}).get("achieved_date", ""),
        reverse=True,
    )
    keep = hall_picks[:HALL_OF_FAME_SIZE]
    overflow = hall_picks[HALL_OF_FAME_SIZE:]
    return keep, overflow


def archive_to_yearly(archive_picks: list[dict]) -> None:
    grouped: dict[str, list[dict]] = {}
    for p in archive_picks:
        ad = p.get("achievement", {}).get("achieved_date", "")[:4]
        if not ad:
            continue
        grouped.setdefault(ad, []).append(p)
    for year, picks in grouped.items():
        path = ARCHIVE_DIR / f"{year}.json"
        existing = get_picks(load_list_file(path))
        save_list_file(path, existing + picks)


def main() -> None:
    active_data = load_list_file(ACTIVE_PATH)
    active_picks = get_picks(active_data)
    if not active_picks:
        print("No active picks.")
        return

    try:
        rows = fetch_all_prices_rows()
    except Exception as e:
        print(f"[ERROR] price fetch: {e}", file=sys.stderr)
        sys.exit(1)

    price_map: dict[int, object] = {}
    for row in rows:
        raw_id = row.get("pick_id")
        if raw_id is None:
            continue
        try:
            pid = int(raw_id)
        except (TypeError, ValueError):
            continue
        price_map[pid] = row.get("close")

    remaining_active: list[dict] = []
    newly_achieved: list[dict] = []
    newly_expired: list[dict] = []

    for pick in active_picks:
        st = pick["status"]["current"]
        if st in ("suspended", "delisted"):
            remaining_active.append(pick)
            continue

        pick_id = pick["id"]
        price_raw = price_map.get(pick_id)

        if price_raw is None or str(price_raw).strip() in ("N/A", "#N/A", "", "nan"):
            handle_error(pick)
            remaining_active.append(pick)
            continue

        try:
            close = float(str(price_raw).replace(",", ""))
        except (TypeError, ValueError):
            handle_error(pick)
            remaining_active.append(pick)
            continue

        update_progress(pick, close)

        target = pick["target"]["price"]
        deadline = date.fromisoformat(pick["duration"]["deadline"])

        if close >= target:
            entry_date = date.fromisoformat(pick["entry"]["date"])
            pick["achievement"] = {
                "achieved_date": today_utc().isoformat()[:10],
                "achieved_close": close,
                "days_taken": (today_utc() - entry_date).days,
                "final_return_rate": round(
                    (close - pick["entry"]["price"]) / pick["entry"]["price"],
                    6,
                ),
            }
            transition(pick, "achieved", "close_touched_target")
            newly_achieved.append(pick)
        elif today_utc() > deadline:
            transition(pick, "expired", "deadline_passed_without_achievement")
            pick["expired_at"] = now_iso()
            newly_expired.append(pick)
        else:
            remaining_active.append(pick)

    save_list_file(ACTIVE_PATH, remaining_active)

    if newly_achieved:
        hall = get_picks(load_list_file(HALL_PATH)) + newly_achieved
        kept, overflow = slide_hall_of_fame(hall)
        save_list_file(HALL_PATH, kept)
        if overflow:
            archive_to_yearly(overflow)

    if newly_expired:
        expired = get_picks(load_list_file(EXPIRED_PATH)) + newly_expired
        save_list_file(EXPIRED_PATH, expired)

    print(
        f"Active: {len(remaining_active)}, achieved: {len(newly_achieved)}, expired: {len(newly_expired)}"
    )


if __name__ == "__main__":
    main()
