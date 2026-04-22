import re

from .models import (
    ALLOWED_DURATIONS,
    COUNTRY_MARKETS,
    Country,
    Market,
    MAX_ACTIVE_PICKS_PER_USER,
    TARGET_RETURN_MAX,
    TARGET_RETURN_MIN,
)


class ValidationError(Exception):
    def __init__(self, code: str, message: str):
        self.code = code
        self.message = message
        super().__init__(message)


def validate_pick_input(
    ticker: str,
    country: str,
    market: str,
    target_return: float,
    duration_days: int,
) -> None:
    if not re.fullmatch(r"[A-Z0-9]{1,10}", ticker):
        raise ValidationError(
            "INVALID_TICKER",
            "Ticker must be 1-10 uppercase letters or digits.",
        )
    try:
        c = Country(country)
        m = Market(market)
    except ValueError as e:
        raise ValidationError("INVALID_ENUM", str(e)) from e
    if m not in COUNTRY_MARKETS[c]:
        raise ValidationError(
            "COUNTRY_MARKET_MISMATCH",
            f"Market {market} is not valid for country {country}.",
        )
    if not (TARGET_RETURN_MIN <= target_return <= TARGET_RETURN_MAX):
        raise ValidationError(
            "INVALID_TARGET_RETURN",
            f"Target return must be between {TARGET_RETURN_MIN:.0%} and {TARGET_RETURN_MAX:.0%} as a fraction (e.g. 0.12 for +12%).",
        )
    if duration_days not in ALLOWED_DURATIONS:
        raise ValidationError(
            "INVALID_DURATION",
            f"Duration must be one of {ALLOWED_DURATIONS}.",
        )


def validate_user_quota(author: str, active_picks: list[dict]) -> None:
    mine = [p for p in active_picks if p.get("author") == author and p.get("status", {}).get("current") == "active"]
    if len(mine) >= MAX_ACTIVE_PICKS_PER_USER:
        raise ValidationError(
            "USER_QUOTA_EXCEEDED",
            f"You may have at most {MAX_ACTIVE_PICKS_PER_USER} active picks.",
        )


def validate_no_duplicate_ticker(author: str, ticker: str, active_picks: list[dict]) -> None:
    for p in active_picks:
        if p.get("author") != author:
            continue
        if p.get("status", {}).get("current") != "active":
            continue
        if p.get("ticker") == ticker:
            raise ValidationError(
                "DUPLICATE_TICKER",
                f"You already have an active pick for {ticker}.",
            )
