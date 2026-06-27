"""One-shot backfill of daily bars for active US/KR/HK picks."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from common.bars_errors import exit_code_for_stats, print_failure_report
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
    p.add_argument(
        "--allow-partial",
        action="store_true",
        help="Exit 0 even if some instruments failed (errors still logged).",
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
        f"skipped_complete={stats.skipped_complete} errors={stats.fetch_errors} "
        f"skipped_jp={stats.skipped_jp} dry_run={stats.dry_run}"
    )
    if stats.failures:
        print_failure_report(stats.failures, script="backfill_bars", stats=stats)
    code = exit_code_for_stats(stats, allow_partial=args.allow_partial)
    if code != 0:
        print(
            "[backfill_bars] FAILED: one or more instruments errored (see FAILURE lines above). "
            "Re-run with --dry-run to inspect planned windows without Sheets.",
            file=sys.stderr,
        )
    elif stats.instruments > 0 and stats.updated == 0 and not args.dry_run:
        print(
            "[backfill_bars] no files changed (already up to date or no windows to fetch).",
            file=sys.stderr,
        )
    sys.exit(code)


if __name__ == "__main__":
    main()
