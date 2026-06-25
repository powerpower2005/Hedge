"""Fetch daily OHLCV via GOOGLEFINANCE \"all\" in a Sheets scratch cell."""

from __future__ import annotations

import os
import sys
import time
from dataclasses import dataclass
from datetime import date, datetime, timedelta
from typing import Any, Callable, TypeVar

import gspread
from gspread.exceptions import APIError

from .bars_errors import BarsFetchError
from .sheets import _formula_sep, get_client

WORKSHEET_BARS_FETCH = "BarsFetch-v1"
SCRATCH_COL = "Z"
SCRATCH_CELL = "Z1"
ROW_STRIDE = 100
POLL_ATTEMPTS = 6
POLL_SLEEP_SEC = 3.0
INITIAL_WAIT_SEC = 5.0
WRITE_MIN_INTERVAL_SEC = 1.1
READ_MIN_INTERVAL_SEC = 1.1
QUOTA_RETRY_ATTEMPTS = 4
QUOTA_RETRY_BASE_SEC = 65.0

_ERROR_TOKENS = frozenset({"N/A", "#N/A", "#REF!", "#ERROR!", "#NAME?", ""})

_last_write_at = 0.0
_last_read_at = 0.0

T = TypeVar("T")


@dataclass(frozen=True)
class BarsFetchJob:
    symbol: str
    start: date
    end: date


def _env_float(name: str, default: float) -> float:
    raw = os.environ.get(name)
    if raw is None or str(raw).strip() == "":
        return default
    try:
        return float(raw)
    except ValueError:
        return default


def _env_int(name: str, default: int) -> int:
    raw = os.environ.get(name)
    if raw is None or str(raw).strip() == "":
        return default
    try:
        return int(raw)
    except ValueError:
        return default


def batch_size() -> int:
    return max(1, _env_int("BARS_SHEETS_BATCH_SIZE", 5))


def batch_interval_sec() -> float:
    """Pause between multi-symbol fetch batches (Sheets quota headroom)."""
    return max(0.0, _env_float("BARS_BATCH_INTERVAL_SEC", 5.0))


def traceback_hint(exc: BaseException) -> str:
    return f"{type(exc).__name__}: {exc}"


def _is_quota_error(exc: BaseException) -> bool:
    return isinstance(exc, APIError) and "429" in str(exc)


def _throttle(kind: str) -> None:
    global _last_write_at, _last_read_at
    interval = WRITE_MIN_INTERVAL_SEC if kind == "write" else READ_MIN_INTERVAL_SEC
    interval = _env_float(
        "BARS_SHEETS_WRITE_INTERVAL_SEC" if kind == "write" else "BARS_SHEETS_READ_INTERVAL_SEC",
        interval,
    )
    now = time.monotonic()
    last = _last_write_at if kind == "write" else _last_read_at
    wait = interval - (now - last)
    if wait > 0:
        time.sleep(wait)
    now = time.monotonic()
    if kind == "write":
        _last_write_at = now
    else:
        _last_read_at = now


def _call_with_quota_retry(
    fn: Callable[[], T],
    *,
    kind: str,
    phase: str,
    symbol: str,
    start: date | None = None,
    end: date | None = None,
) -> T:
    last_exc: BaseException | None = None
    for attempt in range(1, QUOTA_RETRY_ATTEMPTS + 1):
        _throttle(kind)
        try:
            return fn()
        except APIError as e:
            last_exc = e
            if _is_quota_error(e) and attempt < QUOTA_RETRY_ATTEMPTS:
                wait = QUOTA_RETRY_BASE_SEC * attempt
                print(
                    f"[bars] quota retry {attempt}/{QUOTA_RETRY_ATTEMPTS} "
                    f"phase={phase} symbol={symbol} wait={wait:.0f}s "
                    f"(Sheets write/read per minute limit; throttling)",
                    file=sys.stderr,
                )
                time.sleep(wait)
                continue
            raise BarsFetchError(
                phase=phase,
                symbol=symbol,
                start=start,
                end=end,
                message=str(e),
                detail=traceback_hint(e),
            ) from e
        except BarsFetchError:
            raise
        except Exception as e:
            raise BarsFetchError(
                phase=phase,
                symbol=symbol,
                start=start,
                end=end,
                message=str(e),
                detail=traceback_hint(e),
            ) from e
    assert last_exc is not None
    raise BarsFetchError(
        phase=phase,
        symbol=symbol,
        start=start,
        end=end,
        message=str(last_exc),
        detail=traceback_hint(last_exc),
    )


def _get_bars_fetch_worksheet() -> gspread.Worksheet:
    sheet_id = os.environ.get("GOOGLE_SHEET_ID")
    if not sheet_id:
        raise BarsFetchError(
            phase="config",
            symbol="n/a",
            message="GOOGLE_SHEET_ID is not set",
            detail="Set GOOGLE_SHEET_ID in Actions secrets or local env.",
        )
    try:
        client = get_client()
    except FileNotFoundError as e:
        raise BarsFetchError(
            phase="sheets_auth",
            symbol="n/a",
            message="service account file missing",
            detail=str(e),
        ) from e
    except Exception as e:
        raise BarsFetchError(
            phase="sheets_auth",
            symbol="n/a",
            message=f"failed to authorize gspread client: {e}",
            detail=traceback_hint(e),
        ) from e
    try:
        sh = client.open_by_key(sheet_id)
    except Exception as e:
        raise BarsFetchError(
            phase="sheets_open",
            symbol="n/a",
            message=f"cannot open spreadsheet id={sheet_id!r}: {e}",
            detail=traceback_hint(e),
        ) from e
    try:
        return sh.worksheet(WORKSHEET_BARS_FETCH)
    except gspread.WorksheetNotFound:
        try:
            return sh.add_worksheet(WORKSHEET_BARS_FETCH, rows=500, cols=32)
        except Exception as e:
            raise BarsFetchError(
                phase="sheets_worksheet",
                symbol="n/a",
                message=f"cannot create worksheet {WORKSHEET_BARS_FETCH!r}: {e}",
                detail=traceback_hint(e),
            ) from e


def _all_formula(symbol: str, start: date, end: date) -> str:
    s = _formula_sep()
    sym = f'"{symbol}"'
    return (
        f"=IFERROR(GOOGLEFINANCE({sym}{s}\"all\"{s}"
        f"DATE({start.year},{start.month},{start.day}){s}"
        f"DATE({end.year},{end.month},{end.day})){s}\"N/A\")"
    )


def _scratch_row(index: int) -> int:
    return 1 + index * ROW_STRIDE


def _read_range_for_row(row: int) -> str:
    end_row = row + ROW_STRIDE - 1
    return f"{SCRATCH_COL}{row}:AF{end_row}"


def _snapshot_rows(rows: list[list[Any]], *, max_rows: int = 4) -> str:
    if not rows:
        return "(empty grid)"
    lines: list[str] = []
    for row in rows[:max_rows]:
        cells = [str(c).strip() for c in row[:8]]
        lines.append(" | ".join(cells) if any(cells) else "(blank row)")
    if len(rows) > max_rows:
        lines.append(f"... ({len(rows)} row(s) in slice)")
    return "; ".join(lines)


def _parse_date_cell(raw: Any) -> str | None:
    if raw is None:
        return None
    if isinstance(raw, (int, float)) and raw > 30_000:
        base = datetime(1899, 12, 30)
        return (base + timedelta(days=float(raw))).date().isoformat()
    s = str(raw).strip()
    if not s or s in _ERROR_TOKENS:
        return None
    if len(s) >= 10 and s[4] == "-" and s[7] == "-":
        return s[:10]
    return None


def _parse_num(raw: Any) -> float | None:
    if raw is None:
        return None
    s = str(raw).strip()
    if s in _ERROR_TOKENS:
        return None
    try:
        v = float(s.replace(",", ""))
    except ValueError:
        return None
    if v != v or v <= 0:
        return None
    return v


def _parse_volume(raw: Any) -> float | None:
    if raw is None:
        return None
    s = str(raw).strip()
    if s in _ERROR_TOKENS:
        return None
    try:
        v = float(s.replace(",", ""))
    except ValueError:
        return None
    if v != v or v < 0:
        return None
    return v


def parse_googfinance_all_table(rows: list[list[Any]]) -> list[dict[str, Any]]:
    """Parse a GOOGLEFINANCE(..., \"all\", ...) table into bar dicts."""
    if not rows:
        return []
    out: list[dict[str, Any]] = []
    for i, row in enumerate(rows):
        if not row:
            continue
        cells = list(row)
        while len(cells) < 6:
            cells.append("")
        d_raw, o_raw, h_raw, l_raw, c_raw, v_raw = cells[:6]
        d = _parse_date_cell(d_raw)
        if d is None:
            if i == 0 and str(d_raw).strip().lower() == "date":
                continue
            continue
        o, h, l, c = (_parse_num(x) for x in (o_raw, h_raw, l_raw, c_raw))
        if None in (o, h, l, c):
            continue
        bar: dict[str, Any] = {
            "date": d,
            "open": o,
            "high": h,
            "low": l,
            "close": c,
        }
        vol = _parse_volume(v_raw)
        if vol is not None:
            bar["volume"] = vol
        out.append(bar)
    return out


def _parse_batch_slice(rows: list[list[Any]], job: BarsFetchJob) -> list[dict[str, Any]]:
    parsed = parse_googfinance_all_table(rows)
    if parsed:
        return parsed
    flat = [str(c).strip() for row in rows for c in row if str(c).strip()]
    gf_token = flat[0] if len(flat) == 1 else None
    raise BarsFetchError(
        phase="googfinance_empty",
        symbol=job.symbol,
        start=job.start,
        end=job.end,
        message=(
            "GOOGLEFINANCE returned no parseable OHLCV rows"
            + (f" (cell={gf_token!r})" if gf_token else "")
        ),
        detail=f"snapshot={_snapshot_rows(rows)}",
    )


def fetch_bars_google_finance_batch(jobs: list[BarsFetchJob]) -> list[list[dict[str, Any]]]:
    """Fetch multiple symbols in one Sheets write + batched reads (quota-friendly)."""
    if not jobs:
        return []
    ws = _get_bars_fetch_worksheet()
    updates: list[dict[str, Any]] = []
    read_ranges: list[str] = []
    active_jobs: list[BarsFetchJob] = []
    for idx, job in enumerate(jobs):
        if job.start > job.end:
            continue
        row = _scratch_row(len(active_jobs))
        cell = f"{SCRATCH_COL}{row}"
        formula = _all_formula(job.symbol, job.start, job.end)
        active_jobs.append(job)
        updates.append({"range": cell, "values": [[formula]]})
        read_ranges.append(_read_range_for_row(row))

    if not updates:
        return [[] for _ in jobs]

    def _write() -> None:
        ws.batch_update(updates, value_input_option="USER_ENTERED")

    _call_with_quota_retry(
        _write,
        kind="write",
        phase="sheets_write_formula_batch",
        symbol=active_jobs[0].symbol,
        start=active_jobs[0].start,
        end=active_jobs[-1].end,
    )

    initial = _env_float("BARS_SHEETS_INITIAL_WAIT_SEC", INITIAL_WAIT_SEC)
    poll_attempts = _env_int("BARS_SHEETS_POLL_ATTEMPTS", POLL_ATTEMPTS)
    poll_sleep = _env_float("BARS_SHEETS_POLL_SLEEP_SEC", POLL_SLEEP_SEC)
    time.sleep(initial)

    last_slices: list[list[list[Any]]] = [[] for _ in active_jobs]
    for attempt in range(1, poll_attempts + 1):

        def _read() -> list[list[list[Any]]]:
            return ws.batch_get(read_ranges, value_render_option="UNFORMATTED_VALUE")

        slices = _call_with_quota_retry(
            _read,
            kind="read",
            phase="sheets_read_batch",
            symbol=active_jobs[0].symbol,
            start=active_jobs[0].start,
            end=active_jobs[-1].end,
        )

        last_slices = slices
        parsed_batch: list[list[dict[str, Any]] | None] = []
        all_ready = True
        for job, rows in zip(active_jobs, slices):
            rows = rows or []
            try:
                parsed_batch.append(_parse_batch_slice(rows, job))
            except BarsFetchError:
                parsed_batch.append(None)
                all_ready = False
        if all_ready and all(r is not None for r in parsed_batch):
            return [r or [] for r in parsed_batch]
        if attempt < poll_attempts:
            time.sleep(poll_sleep)

    out: list[list[dict[str, Any]]] = []
    for job, rows in zip(active_jobs, last_slices):
        rows = rows or []
        try:
            out.append(_parse_batch_slice(rows, job))
        except BarsFetchError as e:
            raise BarsFetchError(
                phase=e.phase,
                symbol=job.symbol,
                start=job.start,
                end=job.end,
                message=(
                    f"{e.message} (after {poll_attempts} batch polls; "
                    f"batch_size={len(active_jobs)} row_stride={ROW_STRIDE})"
                ),
                detail=(e.detail or "")
                + f" formula={_all_formula(job.symbol, job.start, job.end)}",
            ) from e
    return out


def fetch_bars_google_finance(symbol: str, start: date, end: date) -> list[dict[str, Any]]:
    if start > end:
        return []
    results = fetch_bars_google_finance_batch([BarsFetchJob(symbol=symbol, start=start, end=end)])
    return results[0] if results else []


def fetch_bars_with_symbol_candidates(
    candidates: list[str] | tuple[str, ...],
    start: date,
    end: date,
) -> tuple[str, list[dict[str, Any]]]:
    """Try each exchange prefix until GOOGLEFINANCE returns OHLCV rows."""
    if not candidates:
        raise BarsFetchError(
            phase="config",
            symbol="n/a",
            start=start,
            end=end,
            message="no symbol candidates",
        )
    last_err: BarsFetchError | None = None
    for idx, symbol in enumerate(candidates):
        try:
            bars = fetch_bars_google_finance(symbol, start, end)
            if bars:
                if idx > 0:
                    print(
                        f"[bars] symbol fallback ok used={symbol} "
                        f"skipped={list(candidates[:idx])}",
                        file=sys.stderr,
                    )
                return symbol, bars
        except BarsFetchError as e:
            last_err = e
            retryable = e.phase == "googfinance_empty" or "N/A" in e.message
            if not retryable or idx + 1 >= len(candidates):
                raise
            print(
                f"[bars] symbol retry failed={symbol} phase={e.phase}; "
                f"next={candidates[idx + 1]}",
                file=sys.stderr,
            )
    if last_err:
        raise last_err
    raise BarsFetchError(
        phase="googfinance_empty",
        symbol=candidates[0],
        start=start,
        end=end,
        message="all symbol candidates returned no bars",
        detail=f"candidates={list(candidates)}",
    )
