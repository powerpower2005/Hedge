"""Rank active picks for Telegram highlight sections."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from .entry_lock import is_pending_entry


@dataclass(frozen=True)
class ReturnMove:
    pick: dict[str, Any]
    prior_return: float
    new_return: float

    @property
    def delta(self) -> float:
        return self.new_return - self.prior_return


def _is_active_for_highlights(pick: dict[str, Any], country: str) -> bool:
    if pick.get("country") != country:
        return False
    if is_pending_entry(pick):
        return False
    if pick.get("status", {}).get("current") != "active":
        return False
    return True


def near_target_picks(
    picks: list[dict[str, Any]],
    country: str,
    *,
    limit: int = 5,
) -> list[dict[str, Any]]:
    """Smallest positive distance_to_target (closest to goal from current return)."""
    ranked: list[tuple[float, dict[str, Any]]] = []
    for pick in picks:
        if not _is_active_for_highlights(pick, country):
            continue
        dist = (pick.get("progress") or {}).get("distance_to_target")
        if dist is None:
            continue
        try:
            dist_f = float(dist)
        except (TypeError, ValueError):
            continue
        if dist_f <= 0:
            continue
        ranked.append((dist_f, pick))
    ranked.sort(key=lambda x: x[0])
    return [p for _, p in ranked[:limit]]


def big_move_picks(
    moves: list[ReturnMove],
    *,
    limit: int = 3,
) -> list[ReturnMove]:
    scored = sorted(moves, key=lambda m: abs(m.delta), reverse=True)
    return scored[:limit]
