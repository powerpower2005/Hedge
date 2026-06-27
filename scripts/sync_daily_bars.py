"""Append daily OHLCV bars after judgment (US/KR/HK per --country)."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from common.bars_errors import exit_code_for_stats, print_failure_report
from common.bars_sync import run_bars_sync
from common.market_calendar import should_skip_daily_bars_sync, today_by_country
from common.storage import get_picks, load_list_file

ACTIVE_PATH = Path("data/active.json")


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Sync daily bars for active picks in one country.")
    p.add_argument("--country", required=True, choices=["US", "KR", "HK"])
    p.add_argument("--dry-run", action="store_true", help="Print planned fetch windows only; no Sheets or file writes.")
    p.add_argument(
        "--allow-partial",
        action="store_true",
        help="Exit 0 even if some instruments failed (errors still logged).",
    )
    return p.parse_args()


def main() -> None:
    args = parse_args()
    if not args.dry_run and should_skip_daily_bars_sync(
        args.country, today_by_country(args.country)
    ):
        print(
            f"[sync_daily_bars] skip country={args.country} "
            f"date={today_by_country(args.country).isoformat()} "
            "(weekend / routine market closure; no GF bar fetch)",
        )
        sys.exit(0)

    picks = get_picks(load_list_file(ACTIVE_PATH))
    stats = run_bars_sync(
        picks,
        country=args.country,
        mode="daily",
        dry_run=args.dry_run,
    )
    print(
        f"[sync_daily_bars] country={args.country} instruments={stats.instruments} "
        f"updated={stats.updated} errors={stats.fetch_errors} dry_run={stats.dry_run}"
    )
    if stats.failures:
        print_failure_report(stats.failures, script="sync_daily_bars", stats=stats)
    code = exit_code_for_stats(stats, allow_partial=args.allow_partial)
    if code != 0:
        print(
            f"[sync_daily_bars] FAILED country={args.country}: one or more instruments errored "
            "(see FAILURE lines above). Judgment data may already be updated; fix bars and re-run this step.",
            file=sys.stderr,
        )
    sys.exit(code)


if __name__ == "__main__":
    main()
