"""Structured errors and CI-friendly logging for daily bar sync."""

from __future__ import annotations

import sys
import traceback
from dataclasses import dataclass
from datetime import date
from typing import Any


@dataclass
class SyncFailure:
    instrument: str
    symbol: str
    phase: str
    message: str
    date_range: str | None = None
    detail: str | None = None


class BarsFetchError(Exception):
    """Sheets / GOOGLEFINANCE fetch failed with debug context."""

    def __init__(
        self,
        *,
        phase: str,
        symbol: str,
        message: str,
        start: date | None = None,
        end: date | None = None,
        detail: str | None = None,
        instrument: str | None = None,
    ) -> None:
        self.phase = phase
        self.symbol = symbol
        self.message = message
        self.start = start
        self.end = end
        self.detail = detail
        self.instrument = instrument
        rng = _format_range(start, end)
        prefix = f"instrument={instrument} " if instrument else ""
        super().__init__(f"{prefix}phase={phase} symbol={symbol} range={rng}: {message}")


def instrument_label(key: tuple[str, str, str]) -> str:
    return f"{key[0]}/{key[1]}/{key[2]}"


def _format_range(start: date | None, end: date | None) -> str:
    if start and end:
        return f"{start.isoformat()}..{end.isoformat()}"
    if start:
        return f"{start.isoformat()}.."
    if end:
        return f"..{end.isoformat()}"
    return "n/a"


def _gh_escape(text: str) -> str:
    return text.replace("%", "%25").replace("\r", " ").replace("\n", " ")


def log_sync_failure(failure: SyncFailure) -> None:
    core = (
        f"[bars] FAILURE phase={failure.phase} instrument={failure.instrument} "
        f"symbol={failure.symbol} range={failure.date_range or 'n/a'}: {failure.message}"
    )
    print(core, file=sys.stderr)
    if failure.detail:
        for line in failure.detail.splitlines():
            print(f"[bars] DETAIL {failure.instrument}: {line}", file=sys.stderr)
    print(
        f"::error title=Bars failed ({failure.instrument})::{_gh_escape(core)}",
        file=sys.stderr,
    )


def failure_from_exception(
    key: tuple[str, str, str],
    symbol: str,
    exc: BaseException,
    *,
    phase: str | None = None,
    date_range: str | None = None,
) -> SyncFailure:
    instrument = instrument_label(key)
    if isinstance(exc, BarsFetchError):
        return SyncFailure(
            instrument=instrument,
            symbol=exc.symbol,
            phase=phase or exc.phase,
            message=exc.message,
            date_range=date_range or _format_range(exc.start, exc.end),
            detail=exc.detail,
        )
    return SyncFailure(
        instrument=instrument,
        symbol=symbol,
        phase=phase or "unexpected",
        message=str(exc),
        date_range=date_range,
        detail=traceback.format_exc().strip(),
    )


def print_failure_report(
    failures: list[SyncFailure],
    *,
    script: str,
    stats: Any,
) -> None:
    print(f"[{script}] === failure report ({len(failures)} instrument(s)) ===", file=sys.stderr)
    for i, f in enumerate(failures, start=1):
        print(
            f"[{script}] {i}. phase={f.phase} instrument={f.instrument} symbol={f.symbol} "
            f"range={f.date_range or 'n/a'}: {f.message}",
            file=sys.stderr,
        )
        if f.detail:
            print(f"[{script}]    detail: {f.detail[:500]}", file=sys.stderr)
    print(
        f"[{script}] summary instruments={stats.instruments} updated={stats.updated} "
        f"errors={stats.fetch_errors} skipped_jp={stats.skipped_jp} dry_run={stats.dry_run}",
        file=sys.stderr,
    )


def exit_code_for_stats(stats: Any, *, allow_partial: bool = False) -> int:
    if stats.dry_run:
        return 0
    if stats.fetch_errors > 0 and not allow_partial:
        return 1
    if stats.instruments > 0 and stats.updated == 0 and stats.fetch_errors > 0:
        return 1
    return 0
