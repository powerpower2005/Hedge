"""One-shot backfill of daily bars for active US/KR/HK picks."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from common.bars_sync import run_bars_sync
from common.storage import get_picks, load_list_file

ACTIVE_PATH = Path("data/active.json")
EXPIRED_PATH = Path("data/expired_recent.json")


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Backfill daily OHLCV bars (US/KR/HK; JP skipped).")
    p.add_argument("--dry-run", action="store_true", help="Print planned fetch windows only; no Sheets or file writes.")
    p.add_argument(
        "--include-recent-expired",
        action="store_true",
        help="Also scan data/expired_recent.json (default: active only).",
    )
    return p.parse_args()


def main() -> None:
    args = parse_args()
    picks = get_picks(load_list_file(ACTIVE_PATH))
    if args.include_recent_expired and EXPIRED_PATH.exists():
        picks = picks + get_picks(load_list_file(EXPIRED_PATH))

    stats = run_bars_sync(picks, mode="backfill", dry_run=args.dry_run)
    print(
        f"[backfill_bars] instruments={stats.instruments} updated={stats.updated} "
        f"errors={stats.fetch_errors} skipped_jp={stats.skipped_jp} dry_run={stats.dry_run}"
    )
    if stats.instruments > 0 and stats.updated == 0 and stats.fetch_errors > 0:
        sys.exit(1)
    if stats.instruments > 0 and stats.updated == 0 and not args.dry_run:
        print("[backfill_bars] no files changed (already up to date or all fetches empty).", file=sys.stderr)


if __name__ == "__main__":
    main()
