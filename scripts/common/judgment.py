"""Shared target-touch and progress distance helpers for daily judgment."""

from __future__ import annotations


def target_return_is_bearish(target_return: float) -> bool:
    return target_return < 0


def target_is_reached(close: float, target_price: float, target_return: float) -> bool:
    if target_return < 0:
        return close <= target_price
    return close >= target_price


def distance_to_target(
    entry_price: float,
    target_price: float,
    target_return: float,
    current_close: float,
) -> float:
    """Remaining return gap to target from today's close (target - current for long, current - target for short)."""
    if target_return < 0:
        return round((current_close - target_price) / entry_price, 6)
    return round((target_price - current_close) / entry_price, 6)
