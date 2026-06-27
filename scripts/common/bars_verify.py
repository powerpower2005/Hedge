"""Verify on-disk daily bar files against active pick expectations."""

from __future__ import annotations

import sys
from dataclasses import dataclass, field
from datetime import date
from typing import Any, Literal

from .bars_errors import instrument_label
from .bars_constants import DETAIL_TRADING_BARS
from .bars_storage import last_bar_date, load_bars_file
from .bars_sync import group_instruments, instrument_date_window
from .instrument_key import BARS_ROOT, InstrumentKey, bars_file_path

IssueSeverity = Literal["error", "warning"]
REQUIRED_FIELDS = ("open", "high", "low", "close")
_EMPTY_TOKENS = frozenset({"", "N/A", "#N/A", "#REF!", "#ERROR!", "#NAME?"})


@dataclass
class BarsVerifyIssue:
    severity: IssueSeverity
    code: str
    instrument: str
    message: str
    detail: str | None = None


@dataclass
class BarsVerifyStats:
    instruments: int = 0
    ok: int = 0
    errors: int = 0
    warnings: int = 0
    issues: list[BarsVerifyIssue] = field(default_factory=list)


def _gh_escape(text: str) -> str:
    return text.replace("%", "%25").replace("\r", " ").replace("\n", " ")


def _field_empty(value: Any) -> bool:
    if value is None:
        return True
    if isinstance(value, str):
        return value.strip().upper() in _EMPTY_TOKENS
    return False


def _field_invalid_ohlc(value: Any) -> bool:
    if _field_empty(value):
        return True
    try:
        return float(value) <= 0
    except (TypeError, ValueError):
        return True


def _verify_bar_rows(instrument: str, bars: list[dict[str, Any]]) -> list[BarsVerifyIssue]:
    issues: list[BarsVerifyIssue] = []
    seen: set[str] = set()
    prev_date: str | None = None

    for idx, bar in enumerate(bars):
        bar_date = bar.get("date")
        if not isinstance(bar_date, str) or len(bar_date) < 10:
            issues.append(
                BarsVerifyIssue(
                    severity="error",
                    code="invalid_date",
                    instrument=instrument,
                    message=f"bar[{idx}] missing or invalid date",
                    detail=f"date={bar_date!r}",
                )
            )
            continue

        if bar_date in seen:
            issues.append(
                BarsVerifyIssue(
                    severity="error",
                    code="duplicate_date",
                    instrument=instrument,
                    message=f"duplicate bar date {bar_date}",
                )
            )
        seen.add(bar_date)

        if prev_date is not None and bar_date < prev_date:
            issues.append(
                BarsVerifyIssue(
                    severity="error",
                    code="unsorted_bars",
                    instrument=instrument,
                    message=f"bars not sorted by date ({bar_date} after {prev_date})",
                )
            )
        prev_date = bar_date

        for fld in REQUIRED_FIELDS:
            val = bar.get(fld)
            if _field_invalid_ohlc(val):
                issues.append(
                    BarsVerifyIssue(
                        severity="error",
                        code="empty_ohlc",
                        instrument=instrument,
                        message=f"date={bar_date} field={fld} empty or invalid",
                        detail=f"value={val!r}",
                    )
                )

        if "volume" in bar and _field_empty(bar.get("volume")):
            issues.append(
                BarsVerifyIssue(
                    severity="warning",
                    code="empty_volume",
                    instrument=instrument,
                    message=f"date={bar_date} volume empty",
                    detail=f"value={bar.get('volume')!r}",
                )
            )

    return issues


def _verify_document(key: InstrumentKey, doc: dict[str, Any]) -> list[BarsVerifyIssue]:
    instrument = instrument_label(key)
    issues: list[BarsVerifyIssue] = []
    inst = doc.get("instrument") or {}
    country, market, ticker = key
    for fld, expected in (("country", country), ("market", market), ("ticker", ticker)):
        actual = inst.get(fld)
        if str(actual).upper() != expected:
            issues.append(
                BarsVerifyIssue(
                    severity="error",
                    code="instrument_mismatch",
                    instrument=instrument,
                    message=f"instrument.{fld}={actual!r} path expects {expected}",
                )
            )

    bars = doc.get("bars")
    if not isinstance(bars, list):
        issues.append(
            BarsVerifyIssue(
                severity="error",
                code="invalid_bars",
                instrument=instrument,
                message="bars must be an array",
            )
        )
        return issues

    if not bars:
        issues.append(
            BarsVerifyIssue(
                severity="error",
                code="empty_bars",
                instrument=instrument,
                message="bars array is empty",
            )
        )
        return issues

    issues.extend(_verify_bar_rows(instrument, bars))

    updated_at = doc.get("updated_at")
    last = bars[-1].get("date")
    if isinstance(updated_at, str) and isinstance(last, str) and updated_at != last:
        issues.append(
            BarsVerifyIssue(
                severity="error",
                code="updated_at_mismatch",
                instrument=instrument,
                message=f"updated_at={updated_at} but last bar date={last}",
            )
        )

    return issues


def verify_instrument(
    key: InstrumentKey,
    picks: list[dict[str, Any]],
    *,
    today: date,
    root=BARS_ROOT,
) -> list[BarsVerifyIssue]:
    instrument = instrument_label(key)
    path = bars_file_path(key, root=root)
    doc = load_bars_file(path)

    if doc is None:
        return [
            BarsVerifyIssue(
                severity="error",
                code="missing_file",
                instrument=instrument,
                message="no bar file",
                detail=str(path.as_posix()),
            )
        ]

    issues = _verify_document(key, doc)
    _range_start, range_end = instrument_date_window(picks, today)
    bars = doc.get("bars") or []
    last = last_bar_date(bars) if bars else None
    if last is not None and last < range_end:
        issues.append(
            BarsVerifyIssue(
                severity="warning",
                code="stale_through",
                instrument=instrument,
                message=f"last_bar={last.isoformat()} expected_through={range_end.isoformat()}",
            )
        )

    if bars and len(bars) < DETAIL_TRADING_BARS:
        issues.append(
            BarsVerifyIssue(
                severity="warning",
                code="short_detail_history",
                instrument=instrument,
                message=f"trading_bars={len(bars)} expected>={DETAIL_TRADING_BARS}",
            )
        )

    return issues


def verify_bars_for_picks(
    picks: list[dict[str, Any]],
    *,
    country: str | None = None,
    today: date | None = None,
    root=BARS_ROOT,
) -> BarsVerifyStats:
    today = today or date.today()
    grouped = group_instruments(picks, country=country)
    stats = BarsVerifyStats(instruments=len(grouped))

    for key, inst_picks in sorted(grouped.items()):
        inst_issues = verify_instrument(key, inst_picks, today=today, root=root)
        stats.issues.extend(inst_issues)
        if not inst_issues:
            stats.ok += 1
        elif not any(i.severity == "error" for i in inst_issues):
            stats.ok += 1

    stats.errors = sum(1 for i in stats.issues if i.severity == "error")
    stats.warnings = sum(1 for i in stats.issues if i.severity == "warning")
    return stats


def log_verify_issue(issue: BarsVerifyIssue) -> None:
    level = issue.severity.upper()
    core = f"[verify_bars] {level} {issue.code} {issue.instrument}: {issue.message}"
    print(core, file=sys.stderr)
    if issue.detail:
        print(f"[verify_bars] DETAIL {issue.instrument}: {issue.detail}", file=sys.stderr)
    if issue.severity == "error":
        print(
            f"::error title=Bars verify ({issue.instrument})::{_gh_escape(core)}",
            file=sys.stderr,
        )
    else:
        print(
            f"::warning title=Bars verify ({issue.instrument})::{_gh_escape(core)}",
            file=sys.stderr,
        )


def print_verify_report(stats: BarsVerifyStats) -> None:
    print(
        f"[verify_bars] instruments={stats.instruments} ok={stats.ok} "
        f"errors={stats.errors} warnings={stats.warnings}",
        file=sys.stderr,
    )
    for issue in stats.issues:
        log_verify_issue(issue)


def exit_code_for_verify(stats: BarsVerifyStats, *, fail_on_warning: bool = False) -> int:
    if stats.errors > 0:
        return 1
    if fail_on_warning and stats.warnings > 0:
        return 1
    return 0
