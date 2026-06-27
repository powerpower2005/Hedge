"""Leveled stderr logging for daily bar sync (grep-friendly in Actions)."""

from __future__ import annotations

import sys


def bars_info(message: str) -> None:
    print(f"[bars] INFO {message}", file=sys.stderr)


def bars_warn(message: str) -> None:
    print(f"[bars] WARN {message}", file=sys.stderr)


def bars_ok(message: str) -> None:
    """Recoverable path succeeded after a WARN retry."""
    print(f"[bars] OK {message}", file=sys.stderr)
