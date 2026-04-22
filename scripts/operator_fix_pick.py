"""Operator-only: remove a pick from list JSON files, or mark delisted in active.json."""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

from common.storage import get_picks, load_list_file, save_list_file
from common.versioning import now_iso, read_engine_version


def repo_root() -> Path:
    return Path(os.environ.get("OPERATOR_DATA_ROOT", ".")).resolve()


def list_paths(root: Path) -> tuple[Path, Path, Path, Path]:
    return (
        root / "data" / "active.json",
        root / "data" / "hall_of_fame.json",
        root / "data" / "expired_recent.json",
        root / "data" / "archive",
    )


def list_all_pick_list_files(root: Path) -> list[Path]:
    active, hall, expired, archive_dir = list_paths(root)
    files = [active, hall, expired]
    if archive_dir.is_dir():
        files.extend(sorted(archive_dir.glob("*.json")))
    return files


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


def remove_pick_from_lists(root: Path, pick_id: int) -> list[Path]:
    changed: list[Path] = []
    for path in list_all_pick_list_files(root):
        data = load_list_file(path)
        picks = get_picks(data)
        new_picks = [p for p in picks if p.get("id") != pick_id]
        if len(new_picks) != len(picks):
            save_list_file(path, new_picks)
            changed.append(path)
    return changed


def delist_pick_active(root: Path, pick_id: int, reason: str) -> bool:
    active_path = list_paths(root)[0]
    data = load_list_file(active_path)
    picks = get_picks(data)
    for p in picks:
        if p.get("id") != pick_id:
            continue
        st = p.get("status", {}).get("current")
        if st == "delisted":
            return False
        if st not in ("active", "suspended"):
            print(
                f"ERROR: Pick {pick_id} in active.json has status={st!r}. "
                "Use --action remove for hall/expired/archive entries.",
                file=sys.stderr,
            )
            sys.exit(2)
        transition(p, "delisted", reason)
        p["delisted_at"] = now_iso()
        save_list_file(active_path, picks)
        return True
    return False


def maybe_delete_sheet_row(pick_id: int) -> None:
    from common.sheets import delete_row_for_pick_id

    cred = Path("config/service_account.json")
    if not cred.is_file():
        print("INFO: No config/service_account.json; skip Sheets row delete.", file=sys.stderr)
        return
    if not os.environ.get("GOOGLE_SHEET_ID"):
        print("INFO: GOOGLE_SHEET_ID unset; skip Sheets row delete.", file=sys.stderr)
        return
    try:
        delete_row_for_pick_id(pick_id)
        print(f"Sheets: deleted row for pick_id={pick_id}")
    except Exception as e:
        print(f"WARN: Sheets row delete failed: {e}", file=sys.stderr)


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Operator fix: remove pick from JSON lists or delist in active.")
    p.add_argument("--pick-id", type=int, required=True)
    p.add_argument("--action", choices=("remove", "delist"), required=True)
    p.add_argument(
        "--reason",
        required=True,
        help="For delist: recorded in status.history. For remove: used in log / commit message only.",
    )
    p.add_argument(
        "--no-delete-sheet-row",
        action="store_true",
        help="With remove: do not delete the PriceLookup-v1 row for this pick_id.",
    )
    return p.parse_args(argv)


def _hint_active_pick_ids(root: Path) -> str:
    path = root / "data" / "active.json"
    if not path.is_file():
        return "data/active.json is missing."
    picks = get_picks(load_list_file(path))
    ids: list[int] = []
    for p in picks:
        pid = p.get("id")
        if pid is None:
            continue
        try:
            ids.append(int(pid))
        except (TypeError, ValueError):
            continue
    ids = sorted(set(ids))
    if not ids:
        return "data/active.json has no picks (count=0)."
    return f"data/active.json pick ids: {ids}"


def main(argv: list[str] | None = None) -> None:
    args = parse_args(argv)
    root = repo_root()

    if args.action == "remove":
        changed = remove_pick_from_lists(root, args.pick_id)
        if not changed:
            print(
                f"No pick with id={args.pick_id} found under {root} "
                f"(searched data/active.json, hall_of_fame.json, expired_recent.json, data/archive/*.json).",
                file=sys.stderr,
            )
            print(f"HINT: {_hint_active_pick_ids(root)}", file=sys.stderr)
            print(
                "On GitHub Actions this is the default branch checkout; use a pick id that exists on main.",
                file=sys.stderr,
            )
            sys.exit(1)
        for c in changed:
            rel = c.relative_to(root) if c.is_relative_to(root) else c
            print(f"Updated: {rel}")
        if not args.no_delete_sheet_row:
            maybe_delete_sheet_row(args.pick_id)
    else:
        ok = delist_pick_active(root, args.pick_id, args.reason)
        if not ok:
            print(
                f"Delist: pick id={args.pick_id} not found in active.json or already delisted.",
                file=sys.stderr,
            )
            sys.exit(1)
        print(f"Delisted pick {args.pick_id} in active.json (reason recorded in history).")


if __name__ == "__main__":
    main()
