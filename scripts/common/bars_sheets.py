"""Fetch daily OHLCV via GOOGLEFINANCE \"all\" in a Sheets scratch cell."""

from __future__ import annotations

import os
import time
from datetime import date, datetime, timedelta
from typing import Any

import gspread

from .sheets import _formula_sep, get_client

WORKSHEET_BARS_FETCH = "BarsFetch-v1"
SCRATCH_CELL = "Z1"
READ_RANGE = "Z1:AF500"
POLL_ATTEMPTS = 12
POLL_SLEEP_SEC = 2.0

_ERROR_TOKENS = frozenset({"N/A", "#N/A", "#REF!", "#ERROR!", "#NAME?", ""})


def _get_bars_fetch_worksheet() -> gspread.Worksheet:
    sheet_id = os.environ.get("GOOGLE_SHEET_ID")
    if not sheet_id:
        raise RuntimeError("GOOGLE_SHEET_ID is required")
    client = get_client()
    sh = client.open_by_key(sheet_id)
    try:
        return sh.worksheet(WORKSHEET_BARS_FETCH)
    except gspread.WorksheetNotFound:
        return sh.add_worksheet(WORKSHEET_BARS_FETCH, rows=100, cols=32)


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
    ws = _get_bars_fetch_worksheet()
    formula = _all_formula(symbol, start, end)
    _clear_scratch(ws)
    ws.update_acell(SCRATCH_CELL, formula)
    last_rows: list[list[Any]] = []
    for _ in range(POLL_ATTEMPTS):
        time.sleep(POLL_SLEEP_SEC)
        last_rows = ws.get(READ_RANGE, value_render_option="UNFORMATTED_VALUE") or []
        flat = [c for row in last_rows for c in row if str(c).strip()]
        if not flat:
            continue
        if len(flat) == 1 and str(flat[0]).strip() in _ERROR_TOKENS:
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
    raise RuntimeError(f"GOOGLEFINANCE all returned no bars for {symbol} {start}..{end}")
