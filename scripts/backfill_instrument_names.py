"""Fill missing pick.instrument_name from Sheet column E (GOOGLEFINANCE name).

Run from repo root with the same env as other scripts (GOOGLE_SHEET_ID + service account):

  pip install -r scripts/requirements.txt
  python scripts/backfill_instrument_names.py
"""

from __future__ import annotations

import sys
from pathlib import Path

from common.goog_finance_parse import parse_instrument_name_cell
from common.sheets import get_worksheet
from common.storage import get_picks, load_list_file, save_list_file

ROOT = Path(__file__).resolve().parents[1]
DATA_FILES = [
    ROOT / "data" / "active.json",
    ROOT / "data" / "hall_of_fame.json",
    ROOT / "data" / "expired_recent.json",
]


def load_names_by_pick_id() -> dict[int, str]:
    ws = get_worksheet()
    rows = ws.get_all_values()
    out: dict[int, str] = {}
    for row in rows[1:]:
        if len(row) < 5:
            continue
        try:
            pid = int(float(str(row[0]).replace(",", "")))
        except (TypeError, ValueError):
            continue
        parsed = parse_instrument_name_cell(row[4])
        if parsed:
            out[pid] = parsed
    return out


def main() -> None:
    try:
        names = load_names_by_pick_id()
    except Exception as e:
        print(f"[backfill_instrument_names] FAILED: {e}", file=sys.stderr)
        sys.exit(1)

    total = 0
    for path in DATA_FILES:
        if not path.exists():
            continue
        data = load_list_file(path)
        picks = get_picks(data)
        changed = False
        for p in picks:
            if p.get("instrument_name"):
                continue
            pid = p.get("id")
            if pid is None:
                continue
            try:
                pid_i = int(pid)
            except (TypeError, ValueError):
                continue
            if pid_i in names:
                p["instrument_name"] = names[pid_i]
                changed = True
                total += 1
        if changed:
            save_list_file(path, picks)
            print(f"[backfill_instrument_names] updated {path.name}", file=sys.stderr)

    if total == 0:
        print("[backfill_instrument_names] no missing names filled (sheet or data unchanged).", file=sys.stderr)
    else:
        print(f"[backfill_instrument_names] filled {total} pick(s).", file=sys.stderr)


if __name__ == "__main__":
    main()
