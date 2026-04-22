"""Local JSON Schema validation (subset of CI). Requires: npm i -g ajv-cli ajv-formats."""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def _run(args: list[str]) -> None:
    print("+", " ".join(args))
    subprocess.run(args, cwd=ROOT, check=True)


def main() -> None:
    pick_list = [
        "ajv",
        "validate",
        "-s",
        "schemas/pick_list.v1.json",
        "-r",
        "schemas/pick.v1.json",
        "--strict=false",
    ]
    for data in ("data/active.json", "data/hall_of_fame.json", "data/expired_recent.json"):
        _run(pick_list + ["-d", data])

    archive_dir = ROOT / "data" / "archive"
    if archive_dir.is_dir():
        for path in sorted(archive_dir.glob("*.json")):
            _run(pick_list + ["-d", str(path.relative_to(ROOT))])

    votes_dir = ROOT / "data" / "votes"
    if votes_dir.is_dir():
        for path in sorted(votes_dir.glob("*.json")):
            _run(
                [
                    "ajv",
                    "validate",
                    "-s",
                    "schemas/votes.v1.json",
                    "-d",
                    str(path.relative_to(ROOT)),
                    "--strict=false",
                ]
            )

    _run(["ajv", "validate", "-s", "schemas/meta.v1.json", "-d", "data/meta.json", "--strict=false"])


if __name__ == "__main__":
    try:
        main()
    except subprocess.CalledProcessError:
        sys.exit(1)
    except FileNotFoundError:
        print("ajv not found. Install: npm install -g ajv-cli@5", file=sys.stderr)
        sys.exit(1)
