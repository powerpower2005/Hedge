"""Fetch daily OHLCV via GOOGLEFINANCE \"all\" in a Sheets scratch cell."""

from __future__ import annotations

import os
import time
from datetime import date, datetime, timedelta
from typing import Any

import gspread

from .bars_errors import BarsFetchError
from .sheets import _formula_sep, get_client

WORKSHEET_BARS_FETCH = "BarsFetch-v1"
SCRATCH_CELL = "Z1"
READ_RANGE = "Z1:AF500"
POLL_ATTEMPTS = 12
POLL_SLEEP_SEC = 2.0

_ERROR_TOKENS = frozenset({"N/A", "#N/A", "#REF!", "#ERROR!", "#NAME?", ""})


def traceback_hint(exc: BaseException) -> str:
    return f"{type(exc).__name__}: {exc}"


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
            return sh.add_worksheet(WORKSHEET_BARS_FETCH, rows=100, cols=32)
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


def _clear_scratch(ws: gspread.Worksheet) -> None:
    ws.batch_clear([READ_RANGE])
    ws.update_acell(SCRATCH_CELL, "")


def _snapshot_rows(rows: list[list[Any]], *, max_rows: int = 4) -> str:
    if not rows:
        return "(empty grid)"
    lines: list[str] = []
    for row in rows[:max_rows]:
        cells = [str(c).strip() for c in row[:8]]
        lines.append(" | ".join(cells) if any(cells) else "(blank row)")
    if len(rows) > max_rows:
        lines.append(f"... ({len(rows)} row(s) total in {READ_RANGE})")
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


def fetch_bars_google_finance(symbol: str, start: date, end: date) -> list[dict[str, Any]]:
    if start > end:
        return []
    formula = _all_formula(symbol, start, end)
    try:
        ws = _get_bars_fetch_worksheet()
    except BarsFetchError:
        raise
    except Exception as e:
        raise BarsFetchError(
            phase="sheets_worksheet",
            symbol=symbol,
            start=start,
            end=end,
            message=str(e),
            detail=traceback_hint(e),
        ) from e

    try:
        _clear_scratch(ws)
        ws.update_acell(SCRATCH_CELL, formula)
    except Exception as e:
        raise BarsFetchError(
            phase="sheets_write_formula",
            symbol=symbol,
            start=start,
            end=end,
            message=f"failed writing formula to {WORKSHEET_BARS_FETCH}!{SCRATCH_CELL}: {e}",
            detail=f"formula={formula}",
        ) from e

    last_rows: list[list[Any]] = []
    last_flat: list[str] = []
    for attempt in range(1, POLL_ATTEMPTS + 1):
        time.sleep(POLL_SLEEP_SEC)
        try:
            last_rows = ws.get(READ_RANGE, value_render_option="UNFORMATTED_VALUE") or []
        except Exception as e:
            raise BarsFetchError(
                phase="sheets_read",
                symbol=symbol,
                start=start,
                end=end,
                message=f"poll attempt {attempt}/{POLL_ATTEMPTS} read failed: {e}",
                detail=traceback_hint(e),
            ) from e
        last_flat = [str(c).strip() for row in last_rows for c in row if str(c).strip()]
        if not last_flat:
            continue
        if len(last_flat) == 1 and last_flat[0] in _ERROR_TOKENS:
            break
        parsed = parse_googfinance_all_table(last_rows)
        if parsed:
            _clear_scratch(ws)
            return parsed

    _clear_scratch(ws)
    if last_rows:
        parsed = parse_googfinance_all_table(last_rows)
        if parsed:
            return parsed

    gf_token = last_flat[0] if len(last_flat) == 1 else None
    raise BarsFetchError(
        phase="googfinance_empty",
        symbol=symbol,
        start=start,
        end=end,
        message=(
            "GOOGLEFINANCE returned no parseable OHLCV rows after "
            f"{POLL_ATTEMPTS} polls"
            + (f" (cell={gf_token!r})" if gf_token else "")
        ),
        detail=(
            f"worksheet={WORKSHEET_BARS_FETCH} cell={SCRATCH_CELL} "
            f"formula={formula} snapshot={_snapshot_rows(last_rows)}"
        ),
    )
