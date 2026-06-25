"""Append daily OHLCV bars after judgment (US/KR/HK per --country)."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from common.bars_sync import run_bars_sync
from common.storage import get_picks, load_list_file

ACTIVE_PATH = Path("data/active.json")


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Sync daily bars for active picks in one country.")
    p.add_argument("--country", required=True, choices=["US", "KR", "HK"])
    p.add_argument("--dry-run", action="store_true")
    return p.parse_args()


def main() -> None:
    args = parse_args()
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
    if stats.instruments > 0 and stats.updated == 0 and stats.fetch_errors >= stats.instruments:
        sys.exit(1)


if __name__ == "__main__":
    main()
