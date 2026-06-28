"""Verify daily bar files for active US/KR/HK picks (no Sheets access)."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from common.bars_verify import exit_code_for_verify, print_verify_report, verify_bars_for_picks
from common.instrument_key import BARS_SUPPORTED_COUNTRIES
from common.market_calendar import should_skip_daily_bars_sync, today_by_country
from common.storage import get_picks, load_list_file

ACTIVE_PATH = Path("data/active.json")
EXPIRED_PATH = Path("data/expired_recent.json")


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(
        description="Verify bar files: missing files, empty OHLCV, stale coverage (US/KR/HK; JP skipped)."
    )
    p.add_argument(
        "--country",
        choices=["US", "KR", "HK"],
        help="Limit verification to one country (default: all supported).",
    )
    p.add_argument(
        "--include-recent-expired",
        action="store_true",
        help="Also verify instruments from data/expired_recent.json.",
    )
    p.add_argument(
        "--fail-on-warning",
        action="store_true",
        help="Exit 1 when stale_through or empty_volume warnings exist.",
    )
    return p.parse_args()


def _should_skip_verify(country: str | None) -> bool:
    if country:
        return should_skip_daily_bars_sync(country, today_by_country(country))
    return all(
        should_skip_daily_bars_sync(c, today_by_country(c)) for c in sorted(BARS_SUPPORTED_COUNTRIES)
    )


def main() -> None:
    args = parse_args()
    if _should_skip_verify(args.country):
        label = args.country or "ALL"
        day = today_by_country(args.country) if args.country else today_by_country("KR")
        print(
            f"[verify_bars] skip country={label} date={day.isoformat()} "
            "(weekend / routine market closure; no bar verification)",
        )
        sys.exit(0)

    picks = get_picks(load_list_file(ACTIVE_PATH))
    if args.include_recent_expired and EXPIRED_PATH.exists():
        picks = picks + get_picks(load_list_file(EXPIRED_PATH))

    stats = verify_bars_for_picks(picks, country=args.country)
    print_verify_report(stats)
    code = exit_code_for_verify(stats, fail_on_warning=args.fail_on_warning)
    if code != 0:
        print(
            "[verify_bars] FAILED: see ERROR/WARNING lines above.",
            file=sys.stderr,
        )
    sys.exit(code)


if __name__ == "__main__":
    main()
