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

from .models import market_for_google_finance

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


def get_worksheet() -> gspread.Worksheet:
    sheet_id = os.environ.get("GOOGLE_SHEET_ID")
    if not sheet_id:
        raise RuntimeError("GOOGLE_SHEET_ID is required")
    client = get_client()
    sh = client.open_by_key(sheet_id)
    return sh.worksheet(WORKSHEET_NAME)


def append_ticker_row(pick_id: int, ticker: str, market: str) -> int:
    ws = get_worksheet()
    values = ws.get_all_values()
    next_row = len(values) + 1
    fin_market = market_for_google_finance(market)
    # "closeyest" = previous regular session close (GOOGLEFINANCE real-time attribute,
    # single cell). Used as entry baseline, not last trade. Avoid bare "close" without
    # dates (historical; often #N/A via Sheets API per Google docs).
    formula = f'=IFERROR(GOOGLEFINANCE(C{next_row}&":"&B{next_row},"closeyest"),"N/A")'
    ws.append_row(
        [pick_id, ticker, fin_market, formula],
        value_input_option="USER_ENTERED",
    )
    return next_row


def read_close_at_row(row_index: int) -> str | None:
    ws = get_worksheet()
    cell = ws.cell(row_index, 4)
    v = cell.value
    return str(v).strip() if v is not None else None


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
        for row in reader:
            raw_id = row.get(pid_key)
            if raw_id is None or str(raw_id).strip() == "":
                continue
            try:
                pid = int(float(str(raw_id).replace(",", "")))
            except (TypeError, ValueError):
                continue
            out.append({"pick_id": pid, "close": row.get(close_key)})
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
        out.append({"pick_id": pid, "close": row[3]})
    return out
