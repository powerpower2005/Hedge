import os
from datetime import datetime, timezone
from pathlib import Path


def read_engine_version() -> str:
    p = Path("VERSION")
    if not p.exists():
        return "0.0.0"
    return p.read_text(encoding="utf-8").strip()


def read_current_commit() -> str:
    sha = os.getenv("GITHUB_SHA", "")
    return sha[:7] if sha else ""


def build_generator_meta() -> dict:
    return {
        "name": "called-it",
        "version": read_engine_version(),
        "commit": read_current_commit(),
    }


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
