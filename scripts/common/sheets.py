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
# Column D close: GOOGLEFINANCE daily range length (TODAY()-N .. TODAY()).
_CLOSE_PRICE_LOOKBACK_DAYS = 7

SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive",
]

WORKSHEET_NAME = "PriceLookup-v1"
WORKSHEET_JP_NAME = "PriceLookup-jp-v1"


def _formula_sep() -> str:
    """Argument separator for Sheets formulas (use ';' if the spreadsheet locale is Korean)."""
    sep = (os.environ.get("SHEETS_FORMULA_SEP") or ",").strip()
    return ";" if sep == ";" else ","


def _creds() -> Credentials:
    path = Path("config/service_account.json")
    if not path.exists():
        raise FileNotFoundError("config/service_account.json missing")
    return Credentials.from_service_account_file(str(path), scopes=SCOPES)


def get_client() -> gspread.Client:
    return gspread.authorize(_creds())


def worksheet_name_for_country(country: str | None) -> str:
    if country == "JP":
        return WORKSHEET_JP_NAME
    return WORKSHEET_NAME


def _session_date_formula(next_row: int) -> str:
    """Most recent calendar day in lookback with a numeric GOOGLEFINANCE(..., \"close\", date)."""
    sym = f'C{next_row}&":"&B{next_row}'
    nested = '"N/A"'
    for k in range(_SESSION_DATE_LOOKBACK_DAYS, 0, -1):
        block = (
            f'LET(sym,{sym},dt,TODAY()-{k},c,GOOGLEFINANCE(sym,"close",dt),'
            f'IF(ISNUMBER(c),TEXT(dt,"yyyy-mm-dd"),NA()))'
        )
        nested = f"IFERROR({block},{nested})"
    return f"={nested}"


def _close_price_formula(next_row: int) -> str:
    """Column D: 2nd row after date-desc SORT on 7-day GOOGLEFINANCE close history (INDEX row 2)."""
    s = _formula_sep()
    sym = f'C{next_row}&":"&B{next_row}'
    return (
        f'=IFERROR(INDEX(SORT(GOOGLEFINANCE({sym}{s}"close"{s}TODAY()-{_CLOSE_PRICE_LOOKBACK_DAYS}'
        f'{s}TODAY()){s}1{s}FALSE){s}2{s}2){s}"N/A")'
    )


# Column D: Apps Script refreshAllJpPrices (scripts/sheets_jp_yahoo.gs) writes Yahoo previousClose.
# Do NOT use =yahooF() or GOOGLEFINANCE in D — custom functions cannot call UrlFetchApp (#ERROR!).
JP_CLOSE_PENDING = "PENDING"


def _jp_session_date_formula(next_row: int) -> str:
    s = _formula_sep()
    return f'=IF(ISNUMBER(D{next_row}){s}TEXT(TODAY()-1{s}"yyyy-mm-dd"){s}"")'


def get_worksheet(*, worksheet: str | None = None, country: str | None = None) -> gspread.Worksheet:
    tab = worksheet or worksheet_name_for_country(country)
    sheet_id = os.environ.get("GOOGLE_SHEET_ID")
    if not sheet_id:
        raise RuntimeError("GOOGLE_SHEET_ID is required")
    client = get_client()
    sh = client.open_by_key(sheet_id)
    return sh.worksheet(tab)


def append_ticker_row(
    pick_id: int,
    ticker: str,
    market: str,
    country: str,
    *,
    finance_exchange: str | None = None,
) -> int:
    ws = get_worksheet(country=country)
    values = ws.get_all_values()
    next_row = len(values) + 1
    fin_market = (
        finance_exchange
        if finance_exchange is not None
        else market_for_google_finance(market)
    )
    ticker_cell = ticker_cell_for_price_lookup(ticker, country)
    close_formula = _close_price_formula(next_row)
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


def append_ticker_row_jp(
    pick_id: int,
    yahoo_ticker: str,
    market_label: str,
) -> int:
    """Append to PriceLookup-jp-v1; column D filled by Apps Script refreshAllJpPrices."""
    ws = get_worksheet(worksheet=WORKSHEET_JP_NAME)
    values = ws.get_all_values()
    next_row = len(values) + 1
    session_date_formula = _jp_session_date_formula(next_row)
    ws.append_row(
        [
            pick_id,
            yahoo_ticker,
            market_label,
            JP_CLOSE_PENDING,
            "",
            session_date_formula,
        ],
        value_input_option="USER_ENTERED",
    )
    return next_row


def set_price_lookup_finance_prefix(row_index: int, exchange_prefix: str) -> None:
    ws = get_worksheet(country=None)
    ws.update_cell(row_index, 3, exchange_prefix)


def read_close_at_row(row_index: int, *, country: str | None = None) -> str | None:
    ws = get_worksheet(country=country)
    cell = ws.cell(row_index, 4)
    v = cell.value
    return str(v).strip() if v is not None else None


def read_instrument_name_at_row(row_index: int, *, country: str | None = None) -> str | None:
    ws = get_worksheet(country=country)
    cell = ws.cell(row_index, 5)
    v = cell.value
    return str(v).strip() if v is not None else None


def write_instrument_name_at_row(
    row_index: int, name: str, *, country: str | None = None
) -> None:
    ws = get_worksheet(country=country)
    ws.update_cell(row_index, 5, name)


def apply_jp_quote_to_row(row_index: int, quote) -> None:
    """Post-registration refresh: write D/E/F (same outcome as refreshJpRow)."""
    ws = get_worksheet(worksheet=WORKSHEET_JP_NAME)
    ws.update_cell(row_index, 4, quote.previous_close)
    if quote.name:
        ws.update_cell(row_index, 5, quote.name)
    ws.update_cell(row_index, 6, quote.session_date)


def read_close_session_date_at_row(row_index: int, *, country: str | None = None) -> object | None:
    ws = get_worksheet(country=country)
    cell = ws.cell(row_index, 6)
    return cell.value


def read_close_for_pick_id(pick_id: int, *, country: str | None = None) -> str | None:
    ws = get_worksheet(country=country)
    rows = ws.get_all_values()
    for row in rows[1:]:
        if not row:
            continue
        if str(row[0]).strip() == str(pick_id):
            if len(row) >= 4:
                return str(row[3]).strip() if row[3] is not None else None
            return None
    return None


def delete_row_for_pick_id(pick_id: int, *, country: str | None = None) -> None:
    tabs: list[str]
    if country == "JP":
        tabs = [WORKSHEET_JP_NAME]
    elif country in ("US", "KR", "HK"):
        tabs = [WORKSHEET_NAME]
    else:
        tabs = [WORKSHEET_NAME, WORKSHEET_JP_NAME]
    for tab in tabs:
        try:
            ws = get_worksheet(worksheet=tab)
        except gspread.WorksheetNotFound:
            continue
        rows = ws.get_all_values()
        for i, row in enumerate(rows[1:], start=2):
            if row and str(row[0]).strip() == str(pick_id):
                ws.delete_rows(i)
                return


def fetch_all_prices_rows() -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    for tab in (WORKSHEET_NAME, WORKSHEET_JP_NAME):
        try:
            chunk = _fetch_sheet_rows(tab)
        except gspread.WorksheetNotFound:
            if tab == WORKSHEET_JP_NAME:
                continue
            raise
        out.extend(chunk)
    return out


def _fetch_sheet_rows(worksheet_name: str) -> list[dict[str, Any]]:
    sheet_id = os.environ.get("GOOGLE_SHEET_ID")
    if not sheet_id:
        raise RuntimeError("GOOGLE_SHEET_ID is required")
    url = (
        f"https://docs.google.com/spreadsheets/d/{sheet_id}"
        f"/gviz/tq?tqx=out:csv&sheet={worksheet_name}"
    )
    try:
        with urlopen(url, timeout=60) as resp:
            raw = resp.read().decode("utf-8", errors="replace")
        reader = csv.DictReader(StringIO(raw))
        out: list[dict[str, Any]] = []
        if not reader.fieldnames:
            return _fetch_via_gspread_list(worksheet_name)
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
            return _attach_session_dates_gspread(worksheet_name, out)
    except (URLError, OSError, ValueError, IndexError):
        pass
    return _fetch_via_gspread_list(worksheet_name)


def _attach_session_dates_gspread(
    worksheet_name: str, rows: list[dict[str, Any]]
) -> list[dict[str, Any]]:
    try:
        ws = get_worksheet(worksheet=worksheet_name)
    except gspread.WorksheetNotFound:
        return rows
    all_rows = ws.get_all_values()
    by_id: dict[int, str] = {}
    for row in all_rows[1:]:
        if len(row) < 6:
            continue
        try:
            pid = int(float(str(row[0]).replace(",", "")))
        except (TypeError, ValueError):
            continue
        sess = str(row[5]).strip()
        if sess:
            by_id[pid] = sess
    for item in rows:
        pid = item.get("pick_id")
        if pid in by_id:
            item["close_session_date"] = by_id[pid]
    return rows


def _fetch_via_gspread_list(worksheet_name: str) -> list[dict[str, Any]]:
    ws = get_worksheet(worksheet=worksheet_name)
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
