"""Plan and run daily bar sync for active picks (US/KR/HK)."""

from __future__ import annotations

import sys
import time
from collections import defaultdict
from dataclasses import dataclass
from datetime import date, timedelta
from pathlib import Path
from typing import Any, Literal

from .bars_sheets import fetch_bars_google_finance
from .bars_storage import last_bar_date, load_bars_file, upsert_bars
from .instrument_key import (
    BARS_SUPPORTED_COUNTRIES,
    InstrumentKey,
    bars_file_path,
    finance_symbol,
    instrument_key_from_pick,
)
from .meta import touch_last_bars_sync_at

ACTIVE_PATH = Path("data/active.json")
EXPIRED_PATH = Path("data/expired_recent.json")

SYNC_STATUSES = frozenset({"pending_entry", "active", "suspended"})
DAILY_CATCHUP_DAYS = 14
BACKFILL_CHUNK_DAYS = 90

SyncMode = Literal["daily", "backfill"]


@dataclass
class SyncStats:
    instruments: int = 0
    updated: int = 0
    skipped_jp: int = 0
    skipped_country: int = 0
    fetch_errors: int = 0
    dry_run: bool = False


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


def plan_fetch_windows(
    key: InstrumentKey,
    picks: list[dict[str, Any]],
    today: date,
    mode: SyncMode,
) -> list[tuple[date, date]]:
    range_start, range_end = instrument_date_window(picks, today)
    if range_start > range_end:
        return []

    path = bars_file_path(key)
    doc = load_bars_file(path)
    existing = (doc or {}).get("bars") or []
    last = last_bar_date(existing)

    if mode == "daily":
        fetch_start = range_start
        if last is not None:
            fetch_start = max(fetch_start, last + timedelta(days=1))
        catchup_floor = today - timedelta(days=DAILY_CATCHUP_DAYS)
        fetch_start = min(fetch_start, catchup_floor)
        fetch_start = max(fetch_start, range_start)
        if fetch_start > range_end:
            return []
        return [(fetch_start, range_end)]

    # backfill: full window in chunks
    windows: list[tuple[date, date]] = []
    cursor = range_start
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


def sync_instrument(
    key: InstrumentKey,
    picks: list[dict[str, Any]],
    *,
    today: date,
    mode: SyncMode,
    dry_run: bool,
) -> bool:
    country, market, ticker = key
    symbol = finance_symbol(country, market, ticker)
    windows = plan_fetch_windows(key, picks, today, mode)
    if not windows:
        return False

    collected: list[dict[str, Any]] = []
    for start, end in windows:
        chunk = fetch_bars_google_finance(symbol, start, end)
        collected.extend(chunk)
        time.sleep(0.5)

    if not collected:
        return False
    if dry_run:
        print(
            f"[bars] dry-run would upsert {len(collected)} bar(s) for {country}/{market}/{ticker}",
            file=sys.stderr,
        )
        return True
    return upsert_bars(key, collected)


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

    errors = 0
    updated = 0
    for key, inst_picks in sorted(grouped.items()):
        try:
            if sync_instrument(key, inst_picks, today=today, mode=mode, dry_run=dry_run):
                updated += 1
        except Exception as e:
            errors += 1
            c, m, t = key
            print(f"[bars] ERROR {c}/{m}/{t}: {e}", file=sys.stderr)

    stats.updated = updated
    stats.fetch_errors = errors

    if not dry_run and updated > 0 and touch_meta:
        touch_last_bars_sync_at()

    return stats
