from __future__ import annotations

import csv
import os
from io import StringIO
from pathlib import Path
from typing import Any
from urllib.error import URLError
from urllib.request import urlopen

import gspread
from google.oauth2.service_account import Credentials

from .models import market_for_google_finance, ticker_cell_for_price_lookup

# Calendar days to walk backward from TODAY()-1 when resolving session date (column F).
_SESSION_DATE_LOOKBACK_DAYS = 14

SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive",
]

# Worksheet tab name in the Google Sheet (must match exactly).
WORKSHEET_NAME = "PriceLookup-v1"


def _creds() -> Credentials:
    path = Path("config/service_account.json")
    if not path.exists():
        raise FileNotFoundError("config/service_account.json missing")
    return Credentials.from_service_account_file(str(path), scopes=SCOPES)


def get_client() -> gspread.Client:
    return gspread.authorize(_creds())


def _session_date_formula(next_row: int) -> str:
    """Most recent calendar day in lookback with a numeric GOOGLEFINANCE(..., \"close\", date).

    Nested IFERROR so Sheets can stop after the first hit (yesterday first, then older days).
    Aligns with closeyest in practice: that close is the prior session's official close.
    """
    sym = f'C{next_row}&":"&B{next_row}'
    nested = '"N/A"'
    for k in range(_SESSION_DATE_LOOKBACK_DAYS, 0, -1):
        block = (
            f'LET(sym,{sym},dt,TODAY()-{k},c,GOOGLEFINANCE(sym,"close",dt),'
            f'IF(ISNUMBER(c),TEXT(dt,"yyyy-mm-dd"),NA()))'
        )
        nested = f"IFERROR({block},{nested})"
    return f"={nested}"


def get_worksheet() -> gspread.Worksheet:
    sheet_id = os.environ.get("GOOGLE_SHEET_ID")
    if not sheet_id:
        raise RuntimeError("GOOGLE_SHEET_ID is required")
    client = get_client()
    sh = client.open_by_key(sheet_id)
    return sh.worksheet(WORKSHEET_NAME)


def append_ticker_row(
    pick_id: int,
    ticker: str,
    market: str,
    country: str,
    *,
    finance_exchange: str | None = None,
) -> int:
    ws = get_worksheet()
    values = ws.get_all_values()
    next_row = len(values) + 1
    fin_market = (
        finance_exchange
        if finance_exchange is not None
        else market_for_google_finance(market)
    )
    ticker_cell = ticker_cell_for_price_lookup(ticker, country)
    # "closeyest" = previous regular session close (GOOGLEFINANCE real-time attribute,
    # single cell). Used as entry baseline, not last trade. Avoid bare "close" without
    # dates (historical; often #N/A via Sheets API per Google docs).
    close_formula = f'=IFERROR(GOOGLEFINANCE(C{next_row}&":"&B{next_row},"closeyest"),"N/A")'
    # "name" = full security name (same symbol as D); stored in pick JSON for the UI.
    name_formula = f'=IFERROR(GOOGLEFINANCE(C{next_row}&":"&B{next_row},"name"),"")'
    session_date_formula = _session_date_formula(next_row)
    ws.append_row(
        [
            pick_id,
            ticker_cell,
            fin_market,
            close_formula,
            name_formula,
            session_date_formula,
        ],
        value_input_option="USER_ENTERED",
    )
    return next_row


def set_price_lookup_finance_prefix(row_index: int, exchange_prefix: str) -> None:
    """Column C on PriceLookup-v1: GOOGLEFINANCE exchange prefix (row 1-based)."""
    ws = get_worksheet()
    ws.update_cell(row_index, 3, exchange_prefix)


def read_close_at_row(row_index: int) -> str | None:
    ws = get_worksheet()
    cell = ws.cell(row_index, 4)
    v = cell.value
    return str(v).strip() if v is not None else None


def read_instrument_name_at_row(row_index: int) -> str | None:
    """Column E: GOOGLEFINANCE(..., \"name\") (optional; may lag behind close)."""
    ws = get_worksheet()
    cell = ws.cell(row_index, 5)
    v = cell.value
    return str(v).strip() if v is not None else None


def read_close_session_date_at_row(row_index: int) -> object | None:
    """Column F: calendar date (yyyy-mm-dd) of the last row in GOOGLEFINANCE(..., \"all\", …)."""
    ws = get_worksheet()
    cell = ws.cell(row_index, 6)
    return cell.value


def read_close_for_pick_id(pick_id: int) -> str | None:
    ws = get_worksheet()
    rows = ws.get_all_values()
    for row in rows[1:]:
        if not row:
            continue
        if str(row[0]).strip() == str(pick_id):
            if len(row) >= 4:
                return str(row[3]).strip() if row[3] is not None else None
            return None
    return None


def delete_row_for_pick_id(pick_id: int) -> None:
    ws = get_worksheet()
    rows = ws.get_all_values()
    for i, row in enumerate(rows[1:], start=2):
        if row and str(row[0]).strip() == str(pick_id):
            ws.delete_rows(i)
            return


def fetch_all_prices_rows() -> list[dict[str, Any]]:
    sheet_id = os.environ.get("GOOGLE_SHEET_ID")
    if not sheet_id:
        raise RuntimeError("GOOGLE_SHEET_ID is required")
    url = (
        f"https://docs.google.com/spreadsheets/d/{sheet_id}"
        f"/gviz/tq?tqx=out:csv&sheet={WORKSHEET_NAME}"
    )
    try:
        with urlopen(url, timeout=60) as resp:
            raw = resp.read().decode("utf-8", errors="replace")
        reader = csv.DictReader(StringIO(raw))
        out: list[dict[str, Any]] = []
        if not reader.fieldnames:
            return _fetch_via_gspread_list()
        names = reader.fieldnames
        lower = [h.strip().lower() for h in names]
        try:
            pi = lower.index("pick_id")
        except ValueError:
            pi = 0
        try:
            ci = lower.index("close")
        except ValueError:
            ci = len(names) - 1
        pid_key = names[pi]
        close_key = names[ci]
        name_key = None
        if len(names) >= 5:
            try:
                name_key = names[lower.index("name")]
            except ValueError:
                name_key = names[4]
        for row in reader:
            raw_id = row.get(pid_key)
            if raw_id is None or str(raw_id).strip() == "":
                continue
            try:
                pid = int(float(str(raw_id).replace(",", "")))
            except (TypeError, ValueError):
                continue
            item: dict[str, Any] = {"pick_id": pid, "close": row.get(close_key)}
            if name_key is not None:
                item["name"] = row.get(name_key)
            out.append(item)
        if out:
            return out
    except (URLError, OSError, ValueError, IndexError):
        pass
    return _fetch_via_gspread_list()


def _fetch_via_gspread_list() -> list[dict[str, Any]]:
    ws = get_worksheet()
    rows = ws.get_all_values()
    out: list[dict[str, Any]] = []
    for row in rows[1:]:
        if len(row) < 4:
            continue
        try:
            pid = int(float(str(row[0]).replace(",", "")))
        except (TypeError, ValueError):
            continue
        item: dict[str, Any] = {"pick_id": pid, "close": row[3]}
        if len(row) >= 5:
            item["name"] = row[4]
        if len(row) >= 6 and str(row[5]).strip():
            item["close_session_date"] = str(row[5]).strip()
        out.append(item)
    return out
