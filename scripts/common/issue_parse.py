from __future__ import annotations

import re
from typing import Any


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
        value = value_lines[0] if value_lines else ""
        key = _header_to_key(header)
        if key:
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
    return {
        "ticker": ticker,
        "country": country,
        "market": market,
        "target_return": pct / 100.0,
        "duration_days": duration_days,
    }
