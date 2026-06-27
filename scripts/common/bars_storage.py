"""Load, merge, and save instrument daily bar JSON files."""

from __future__ import annotations

import json
from datetime import date
from pathlib import Path
from typing import Any

from .bars_constants import detail_calendar_lookback_start
from .instrument_key import BARS_ROOT, InstrumentKey, bars_file_path
from .versioning import build_generator_meta, now_iso

SCHEMA_VERSION = "1.0.0"
SOURCE_GOOGLE_SHEETS = "google_sheets_googfinance"


def load_bars_file(path: Path) -> dict[str, Any] | None:
    if not path.exists():
        return None
    return json.loads(path.read_text(encoding="utf-8"))


def empty_bars_document(key: InstrumentKey) -> dict[str, Any]:
    country, market, ticker = key
    return {
        "schema_version": SCHEMA_VERSION,
        "generator": build_generator_meta(),
        "generated_at": now_iso(),
        "instrument": {"country": country, "market": market, "ticker": ticker},
        "source": SOURCE_GOOGLE_SHEETS,
        "updated_at": "1970-01-01",
        "bars": [],
    }


def merge_bars(existing: list[dict[str, Any]], incoming: list[dict[str, Any]]) -> tuple[list[dict], bool]:
    by_date: dict[str, dict[str, Any]] = {b["date"]: dict(b) for b in existing}
    changed = False
    for bar in incoming:
        d = bar["date"]
        prev = by_date.get(d)
        normalized = dict(bar)
        if prev != normalized:
            changed = True
        by_date[d] = normalized
    merged = sorted(by_date.values(), key=lambda b: b["date"])
    if len(merged) != len(existing):
        changed = True
    return merged, changed


def last_bar_date(bars: list[dict[str, Any]]) -> date | None:
    if not bars:
        return None
    return date.fromisoformat(bars[-1]["date"])


def trim_bars_to_detail_lookback(
    bars: list[dict[str, Any]],
    *,
    today: date | None = None,
) -> list[dict[str, Any]]:
    """Drop bars older than the calendar lookback used for the 250-trading-day chart."""
    today = today or date.today()
    floor = detail_calendar_lookback_start(today).isoformat()
    return [b for b in bars if b["date"] >= floor]


def save_bars_document(path: Path, doc: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    doc = dict(doc)
    doc["generator"] = build_generator_meta()
    doc["generated_at"] = now_iso()
    path.write_text(json.dumps(doc, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def upsert_bars(
    key: InstrumentKey,
    incoming: list[dict[str, Any]],
    *,
    root: Path | None = None,
) -> bool:
    """Merge incoming bars into the on-disk file. Returns True if file changed."""
    path = bars_file_path(key, root=root)
    doc = load_bars_file(path) or empty_bars_document(key)
    merged, changed = merge_bars(doc.get("bars") or [], incoming)
    trimmed = trim_bars_to_detail_lookback(merged)
    if trimmed != merged:
        changed = True
    merged = trimmed
    if not changed:
        return False
    doc["bars"] = merged
    if merged:
        doc["updated_at"] = merged[-1]["date"]
    save_bars_document(path, doc)
    return True
