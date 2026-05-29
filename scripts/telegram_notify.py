"""CLI: verify Telegram, test send, or daily digest from active.json."""

from __future__ import annotations

import argparse
import sys
from datetime import date
from pathlib import Path

from common.storage import get_picks, load_list_file
from common.telegram_client import send_telegram_message, verify_telegram_setup
from common.telegram_config import telegram_configured
from common.telegram_delivery import deliver_judgment_highlights

ACTIVE_PATH = Path("data/active.json")


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Send Telegram notifications.")
    p.add_argument(
        "--mode",
        choices=("verify", "test", "daily"),
        required=True,
        help="verify: getMe/getChat only; test: ping; daily: digest from active.json",
    )
    p.add_argument("--country", choices=("KR", "US", "HK", "JP"), help="Required for --mode daily")
    p.add_argument("--message", default="", help="Custom text for --mode test")
    return p.parse_args()


def main() -> None:
    args = parse_args()
    if not telegram_configured():
        print(
            "Telegram not configured. Set GitHub secrets "
            "TELEGRAM_BOT_TOKEN_HEALTHY_FIRE_BOT and TELEGRAM_CHAT_ID_HEALTHY_GAEMI.",
            file=sys.stderr,
        )
        sys.exit(1)

    if args.mode == "verify":
        verify_telegram_setup()
        print("[telegram] verify OK (bot + chat reachable)")
        return

    verify_telegram_setup()

    if args.mode == "test":
        body = args.message.strip() or "Healthy_GAEMI - Telegram test OK (hedge bot)."
        send_telegram_message(body)
        print("Test message sent.")
        return

    if not args.country:
        print("--country required for --mode daily", file=sys.stderr)
        sys.exit(2)

    active = get_picks(load_list_file(ACTIVE_PATH))
    deliver_judgment_highlights(
        country=args.country,
        judgment_day=date.today(),
        newly_achieved=[],
        remaining_active=active,
        move_deltas=[],
        near_limit=5,
        move_limit=3,
    )
    print(
        f"Daily digest sent for {args.country} (near-target from active.json; big moves empty without judgment run)."
    )


if __name__ == "__main__":
    main()
