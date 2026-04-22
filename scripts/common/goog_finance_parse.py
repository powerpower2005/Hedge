"""Parse cell values returned by GOOGLEFINANCE in Sheets (no gspread)."""

from __future__ import annotations

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
