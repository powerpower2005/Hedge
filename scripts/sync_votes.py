"""Sync +1 / -1 reactions from GitHub issues into active picks."""

from __future__ import annotations

from pathlib import Path

from common.github_api import get_issue_reactions
from common.storage import get_picks, load_list_file, save_list_file
from common.versioning import now_iso

ACTIVE_PATH = Path("data/active.json")


def main() -> None:
    data = load_list_file(ACTIVE_PATH)
    picks = get_picks(data)
    changed = False
    for pick in picks:
        if pick.get("status", {}).get("current") != "active":
            continue
        try:
            counts = get_issue_reactions(int(pick["issue_number"]))
        except Exception as e:
            print(f"[WARN] issue #{pick.get('issue_number')}: {e}")
            continue
        current = pick.get("votes") or {}
        if current.get("likes") != counts["likes"] or current.get("dislikes") != counts["dislikes"]:
            pick["votes"] = {
                "likes": counts["likes"],
                "dislikes": counts["dislikes"],
                "last_synced": now_iso(),
            }
            changed = True
    if changed:
        save_list_file(ACTIVE_PATH, picks)
        print("Votes updated.")
    else:
        print("No vote changes.")


if __name__ == "__main__":
    main()
