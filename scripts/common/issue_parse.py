from __future__ import annotations

import re
from typing import Any

AUTHOR_NOTE_MAX_LEN = 2000


def parse_issue_form(body: str | None) -> dict[str, Any]:
    if not body or not body.strip():
        return {}
    parts = re.split(r"(?m)^###\s+", body.strip())
    out: dict[str, str] = {}
    for block in parts:
        block = block.strip()
        if not block:
            continue
        lines = block.splitlines()
        header = lines[0].strip()
        value_lines = [ln.strip() for ln in lines[1:] if ln.strip()]
        key = _header_to_key(header)
        if not key:
            continue
        if key == "author_note":
            value = "\n".join(value_lines)
        else:
            value = value_lines[0] if value_lines else ""
        out[key] = value
    return out


def _header_to_key(header: str) -> str | None:
    h = header.lower()
    if "ticker" in h:
        return "ticker"
    if h.startswith("country") or "country" in h:
        return "country"
    if "market" in h:
        return "market"
    if "target" in h and "return" in h:
        return "target_return_pct"
    if "duration" in h:
        return "duration_days"
    if "additional note" in h or "추가 메모" in header:
        return "author_note"
    return None


def normalized_fields(raw: dict[str, Any]) -> dict[str, Any]:
    if "ticker" not in raw:
        raise KeyError("ticker")
    def _strip(s: str) -> str:
        return s.strip().strip("*").strip()

    ticker = _strip(str(raw["ticker"])).upper().replace(" ", "")
    country = _strip(str(raw.get("country", ""))).upper()
    market = _strip(str(raw.get("market", ""))).upper()
    pct = float(_strip(str(raw.get("target_return_pct", ""))).replace("%", ""))
    duration_days = int(_strip(str(raw.get("duration_days", ""))))
    note_raw = raw.get("author_note")
    author_note: str | None
    if note_raw is None or str(note_raw).strip() == "":
        author_note = None
    else:
        author_note = str(note_raw).strip()
        if len(author_note) > AUTHOR_NOTE_MAX_LEN:
            author_note = author_note[:AUTHOR_NOTE_MAX_LEN]
    out: dict[str, Any] = {
        "ticker": ticker,
        "country": country,
        "market": market,
        "target_return": pct / 100.0,
        "duration_days": duration_days,
    }
    if author_note is not None:
        out["author_note"] = author_note
    return out
