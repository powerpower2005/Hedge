"""Find picks by GitHub issue number across public list files (idempotent registration)."""

from __future__ import annotations

from pathlib import Path
from typing import Optional

from .storage import get_picks, load_list_file

DEFAULT_LIST_PATHS = (
    Path("data/active.json"),
    Path("data/hall_of_fame.json"),
    Path("data/expired_recent.json"),
)


def find_pick_by_issue_number(
    issue_number: int,
    *,
    list_paths: tuple[Path, ...] = DEFAULT_LIST_PATHS,
) -> Optional[dict]:
    """Return the first pick dict with matching issue_number, or None."""
    for path in list_paths:
        if not path.exists():
            continue
        try:
            picks = get_picks(load_list_file(path))
        except (OSError, ValueError, TypeError):
            continue
        for p in picks:
            if p.get("issue_number") == issue_number:
                return p
    return None
