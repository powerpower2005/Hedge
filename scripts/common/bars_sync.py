"""Plan and run daily bar sync for active picks (US/KR/HK)."""

from __future__ import annotations

import sys
import time
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import date, timedelta
from pathlib import Path
from typing import Any, Literal

from .bars_constants import DETAIL_TRADING_BARS, detail_calendar_lookback_start
from .bars_errors import (
    BarsFetchError,
    SyncFailure,
    failure_from_exception,
    instrument_label,
    log_sync_failure,
)
from .bars_sheets import (
    BarsFetchJob,
    batch_interval_sec,
    batch_size,
    fetch_bars_google_finance_batch,
    fetch_bars_with_symbol_candidates,
)
from .bars_storage import last_bar_date, load_bars_file, upsert_bars
from .instrument_key import (
    BARS_SUPPORTED_COUNTRIES,
    InstrumentKey,
    bars_file_path,
    finance_symbol_candidates,
    instrument_key_from_pick,
)
from .meta import touch_last_bars_sync_at

ACTIVE_PATH = Path("data/active.json")
EXPIRED_PATH = Path("data/expired_recent.json")

SYNC_STATUSES = frozenset({"pending_entry", "active", "suspended"})
DAILY_CATCHUP_DAYS = 14
BACKFILL_CHUNK_DAYS = 90

SyncMode = Literal["daily", "backfill"]


@dataclass(frozen=True)
class _FetchWork:
    key: InstrumentKey
    symbol: str
    symbol_candidates: tuple[str, ...]
    start: date
    end: date


def _chunked(items: list[_FetchWork], size: int) -> list[list[_FetchWork]]:
    if size < 1:
        size = 1
    return [items[i : i + size] for i in range(0, len(items), size)]


def _collect_fetch_work(
    grouped: dict[InstrumentKey, list[dict[str, Any]]],
    *,
    today: date,
    mode: SyncMode,
) -> list[_FetchWork]:
    work: list[_FetchWork] = []
    for key, inst_picks in sorted(grouped.items()):
        country, market, ticker = key
        candidates = tuple(finance_symbol_candidates(country, market, ticker))
        for start, end in plan_fetch_windows(key, inst_picks, today, mode):
            work.append(
                _FetchWork(
                    key=key,
                    symbol=candidates[0],
                    symbol_candidates=candidates,
                    start=start,
                    end=end,
                )
            )
    return work


def _fetch_one_work(w: _FetchWork) -> list[dict[str, Any]]:
    _symbol, bars = fetch_bars_with_symbol_candidates(
        w.symbol_candidates, w.start, w.end
    )
    return bars


def _fetch_work_batch(
    batch: list[_FetchWork],
) -> list[tuple[_FetchWork, list[dict[str, Any]] | BaseException]]:
    jobs = [BarsFetchJob(symbol=w.symbol, start=w.start, end=w.end) for w in batch]
    try:
        bars_lists = fetch_bars_google_finance_batch(jobs)
        return [(w, bars) for w, bars in zip(batch, bars_lists)]
    except BarsFetchError:
        if len(batch) == 1:
            w = batch[0]
            try:
                return [(w, _fetch_one_work(w))]
            except BaseException as e:
                return [(w, e)]
        out: list[tuple[_FetchWork, list[dict[str, Any]] | BaseException]] = []
        for w in batch:
            try:
                out.append((w, _fetch_one_work(w)))
            except BaseException as e:
                out.append((w, e))
        return out


@dataclass
class SyncStats:
    instruments: int = 0
    updated: int = 0
    skipped_jp: int = 0
    skipped_country: int = 0
    fetch_errors: int = 0
    dry_run: bool = False
    failures: list[SyncFailure] = field(default_factory=list)


def _pick_start_date(pick: dict[str, Any]) -> date:
    entry = pick.get("entry") or {}
    raw = entry.get("date")
    if isinstance(raw, str) and len(raw) >= 10:
        return date.fromisoformat(raw[:10])
    created = pick.get("created_at")
    if isinstance(created, str) and len(created) >= 10:
        return date.fromisoformat(created[:10])
    return date.today()


def _pick_end_date(pick: dict[str, Any], today: date) -> date:
    deadline = (pick.get("duration") or {}).get("deadline")
    if isinstance(deadline, str) and len(deadline) >= 10:
        end = date.fromisoformat(deadline[:10])
        return min(end, today)
    return today


def _eligible_pick(pick: dict[str, Any], country: str | None) -> bool:
    st = (pick.get("status") or {}).get("current")
    if st not in SYNC_STATUSES:
        return False
    c = pick.get("country")
    if not c:
        return False
    if c == "JP":
        return False
    if country and c != country:
        return False
    return c in BARS_SUPPORTED_COUNTRIES


def group_instruments(
    picks: list[dict[str, Any]],
    *,
    country: str | None = None,
) -> dict[InstrumentKey, list[dict[str, Any]]]:
    grouped: dict[InstrumentKey, list[dict[str, Any]]] = defaultdict(list)
    for pick in picks:
        if not _eligible_pick(pick, country):
            continue
        key = instrument_key_from_pick(pick)
        if key is None:
            continue
        grouped[key].append(pick)
    return dict(grouped)


def instrument_date_window(
    picks: list[dict[str, Any]],
    today: date,
) -> tuple[date, date]:
    starts = [_pick_start_date(p) for p in picks]
    ends = [_pick_end_date(p, today) for p in picks]
    return min(starts), max(ends)


def fetch_floor_start(picks: list[dict[str, Any]], today: date) -> date:
    """Earliest date to retain/fetch: min(pick entry, 250-trading-day lookback)."""
    range_start, _ = instrument_date_window(picks, today)
    return min(range_start, detail_calendar_lookback_start(today))


def _first_bar_date(bars: list[dict[str, Any]]) -> date | None:
    if not bars:
        return None
    raw = bars[0].get("date")
    if isinstance(raw, str) and len(raw) >= 10:
        return date.fromisoformat(raw[:10])
    return None


def _merge_adjacent_windows(
    windows: list[tuple[date, date]],
) -> list[tuple[date, date]]:
    if not windows:
        return []
    ordered = sorted(windows)
    merged: list[tuple[date, date]] = [ordered[0]]
    for start, end in ordered[1:]:
        prev_start, prev_end = merged[-1]
        if start <= prev_end + timedelta(days=1):
            merged[-1] = (prev_start, max(prev_end, end))
        else:
            merged.append((start, end))
    return merged


def _needs_detail_lookback(
    existing: list[dict[str, Any]],
    fetch_floor: date,
) -> bool:
    if len(existing) < DETAIL_TRADING_BARS:
        return True
    first = _first_bar_date(existing)
    return first is not None and first > fetch_floor


def plan_fetch_windows(
    key: InstrumentKey,
    picks: list[dict[str, Any]],
    today: date,
    mode: SyncMode,
) -> list[tuple[date, date]]:
    range_start, range_end = instrument_date_window(picks, today)
    if range_start > range_end:
        return []

    fetch_floor = fetch_floor_start(picks, today)

    path = bars_file_path(key)
    doc = load_bars_file(path)
    existing = (doc or {}).get("bars") or []
    last = last_bar_date(existing)
    first = _first_bar_date(existing)

    if mode == "daily":
        windows: list[tuple[date, date]] = []
        if _needs_detail_lookback(existing, fetch_floor):
            lookback_end = (first - timedelta(days=1)) if first else range_end
            if fetch_floor <= lookback_end:
                windows.append((fetch_floor, lookback_end))

        if last is None:
            forward_start = fetch_floor
        else:
            forward_start = last + timedelta(days=1)
        catchup_floor = today - timedelta(days=DAILY_CATCHUP_DAYS)
        forward_start = min(forward_start, catchup_floor)
        forward_start = max(forward_start, fetch_floor)
        if forward_start <= range_end:
            windows.append((forward_start, range_end))
        return _merge_adjacent_windows(windows)

    # backfill: full window in chunks from fetch_floor
    windows: list[tuple[date, date]] = []
    cursor = fetch_floor
    while cursor <= range_end:
        chunk_end = min(cursor + timedelta(days=BACKFILL_CHUNK_DAYS - 1), range_end)
        if last is not None and chunk_end <= last:
            cursor = chunk_end + timedelta(days=1)
            continue
        win_start = cursor
        if last is not None and win_start <= last:
            win_start = last + timedelta(days=1)
        if win_start <= chunk_end:
            windows.append((win_start, chunk_end))
        cursor = chunk_end + timedelta(days=1)
    return windows


def run_bars_sync(
    picks: list[dict[str, Any]],
    *,
    country: str | None = None,
    mode: SyncMode = "daily",
    today: date | None = None,
    dry_run: bool = False,
    touch_meta: bool = True,
) -> SyncStats:
    today = today or date.today()
    stats = SyncStats(dry_run=dry_run)

    for pick in picks:
        c = pick.get("country")
        if c == "JP":
            stats.skipped_jp += 1
        elif country and c != country:
            stats.skipped_country += 1

    grouped = group_instruments(picks, country=country)
    stats.instruments = len(grouped)

    if not grouped:
        return stats

    work = _collect_fetch_work(grouped, today=today, mode=mode)
    if dry_run:
        for item in work:
            c, m, t = item.key
            print(
                f"[bars] dry-run plan {c}/{m}/{t} ({item.symbol}) "
                f"{item.start.isoformat()}..{item.end.isoformat()} mode={mode}",
                file=sys.stderr,
            )
        stats.updated = len({w.key for w in work})
        return stats

    pending: dict[InstrumentKey, list[dict[str, Any]]] = defaultdict(list)
    errors = 0
    updated = 0
    failures: list[SyncFailure] = []
    size = batch_size()
    pause = batch_interval_sec()
    batches = _chunked(work, size)

    for batch_idx, batch in enumerate(batches):
        print(
            f"[bars] batch fetch {batch_idx + 1}/{len(batches)} size={len(batch)} symbols="
            f"{','.join(w.symbol for w in batch)}",
            file=sys.stderr,
        )
        for w, result in _fetch_work_batch(batch):
            range_hint = f"{w.start.isoformat()}..{w.end.isoformat()}"
            if isinstance(result, BaseException):
                errors += 1
                if isinstance(result, BarsFetchError) and not result.instrument:
                    result = BarsFetchError(
                        phase=result.phase,
                        symbol=result.symbol,
                        message=result.message,
                        start=result.start,
                        end=result.end,
                        detail=result.detail,
                        instrument=instrument_label(w.key),
                    )
                failure = failure_from_exception(
                    w.key, w.symbol, result, date_range=range_hint
                )
                failures.append(failure)
                log_sync_failure(failure)
            else:
                pending[w.key].extend(result)

        if pause > 0 and batch_idx < len(batches) - 1:
            print(
                f"[bars] batch pause {pause:.1f}s before next fetch (BARS_BATCH_INTERVAL_SEC)",
                file=sys.stderr,
            )
            time.sleep(pause)

    for key, bars in pending.items():
        if not bars:
            continue
        if upsert_bars(key, bars):
            updated += 1

    stats.updated = updated
    stats.fetch_errors = errors
    stats.failures = failures

    if not dry_run and updated > 0 and touch_meta:
        touch_last_bars_sync_at()

    return stats
