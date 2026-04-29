"""Parse cell values returned by GOOGLEFINANCE in Sheets (no gspread)."""

from __future__ import annotations

from datetime import date, datetime

_INSTRUMENT_NAME_MAX_LEN = 280


def parse_instrument_name_cell(raw: str | None) -> str | None:
    """Normalize GOOGLEFINANCE(..., \"name\") display text; None if empty or error token."""
    if raw is None:
        return None
    s = str(raw).strip()
    if not s:
        return None
    u = s.upper()
    if u in ("N/A", "#N/A", "#VALUE!", "#REF!", "#NUM!"):
        return None
    if len(s) > _INSTRUMENT_NAME_MAX_LEN:
        return s[:_INSTRUMENT_NAME_MAX_LEN]
    return s


def parse_close_session_date_cell(raw: object | None) -> date | None:
    """Parse column F (last row date from GOOGLEFINANCE all); None if not ready or error."""
    if raw is None:
        return None
    if isinstance(raw, datetime):
        return raw.date()
    if isinstance(raw, date):
        return raw
    s = str(raw).strip()
    if not s:
        return None
    u = s.upper()
    if u in ("N/A", "#N/A", "#VALUE!", "#REF!", "#NUM!"):
        return None
    if len(s) >= 10:
        head = s[:10].replace("/", "-")
        try:
            return date.fromisoformat(head)
        except ValueError:
            pass
    return None
