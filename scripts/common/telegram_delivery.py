"""Deliver Telegram notifications (judgment highlights, new pick)."""

from __future__ import annotations

from datetime import date
from typing import Any

from .telegram_client import send_telegram_message
from .telegram_format import format_judgment_digest, format_new_pick_message
from .telegram_highlights import ReturnMove, big_move_picks, near_target_picks


def deliver_judgment_highlights(
    *,
    country: str,
    judgment_day: date,
    remaining_active: list[dict[str, Any]],
    move_deltas: list[ReturnMove],
    near_limit: int = 5,
    move_limit: int = 3,
) -> None:
    near = near_target_picks(remaining_active, country, limit=near_limit)
    moves = big_move_picks(move_deltas, limit=move_limit)
    text = format_judgment_digest(
        country,
        judgment_day.isoformat(),
        near,
        moves,
        near_limit=near_limit,
        move_limit=move_limit,
    )
    send_telegram_message(text)
    print(f"[telegram] judgment highlights sent for {country}")


def deliver_new_pick(pick: dict[str, Any]) -> None:
    send_telegram_message(format_new_pick_message(pick))
    print(f"[telegram] new pick sent id={pick.get('id')}")
