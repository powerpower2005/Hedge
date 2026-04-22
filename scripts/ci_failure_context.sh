#!/usr/bin/env bash
# Prints non-secret CI hints after a failed step. Safe to run with `if: failure()`.
set +e
echo "::group::CI failure context (no secrets)"
echo "time_utc=$(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "pwd=$(pwd)"
echo "runner_os=${RUNNER_OS:-unknown}"
echo "github_ref=${GITHUB_REF:-n/a} sha=${GITHUB_SHA:-n/a} workflow=${GITHUB_WORKFLOW:-n/a} job=${GITHUB_JOB:-n/a}"
if command -v git >/dev/null 2>&1; then
  echo "--- git ---"
  git log -1 --oneline 2>/dev/null || echo "(no git log)"
  git status -sb 2>/dev/null | head -25 || true
fi
echo "--- data (names only) ---"
if [[ -d data ]]; then
  ls -la data/ 2>/dev/null || true
  shopt -s nullglob 2>/dev/null || true
  arc=(data/archive/*.json)
  if ((${#arc[@]})); then
    echo "archive_json_count=${#arc[@]}"
  fi
else
  echo "(no data/ directory)"
fi
echo "--- data summaries (no pick bodies) ---"
if command -v python >/dev/null 2>&1; then
  python <<'PY'
import json
from pathlib import Path

def brief(path: Path) -> None:
    if not path.is_file():
        print(f"{path}: missing")
        return
    try:
        d = json.loads(path.read_text(encoding="utf-8"))
    except Exception as e:
        print(f"{path}: JSON error {e!r}")
        return
    if path.name == "meta.json":
        print(f"{path}: next_pick_id={d.get('next_pick_id')!r}")
        return
    picks = d.get("data", {}).get("picks")
    if not isinstance(picks, list):
        print(f"{path}: unexpected shape keys={list(d.keys())[:8]}")
        return
    ids = [p.get("id") for p in picks[:20]]
    print(f"{path}: count={len(picks)} sample_ids={ids}")

for p in (
    Path("data/active.json"),
    Path("data/hall_of_fame.json"),
    Path("data/expired_recent.json"),
    Path("data/meta.json"),
):
    brief(p)
PY
else
  echo "(python not available for JSON summary)"
fi
echo "--- secret presence only (never print values) ---"
[[ -n "${GOOGLE_SHEET_ID:-}" ]] && echo "GOOGLE_SHEET_ID=set" || echo "GOOGLE_SHEET_ID=unset"
[[ -f config/service_account.json ]] && echo "service_account_json_file=present" || echo "service_account_json_file=absent"
[[ -n "${GITHUB_TOKEN:-}" ]] && echo "GITHUB_TOKEN=present" || echo "GITHUB_TOKEN=unset"
[[ -n "${REPO:-}" ]] && echo "REPO=${REPO}" || echo "REPO=unset"
echo "--- toolchain ---"
command -v python >/dev/null && python --version 2>&1 || echo "python: missing"
command -v node >/dev/null && node --version 2>&1 || echo "node: missing"
command -v npm >/dev/null && npm --version 2>&1 || echo "npm: missing"
command -v ajv >/dev/null && ajv --version 2>&1 || echo "ajv: missing"
if [[ -d frontend ]]; then
  echo "--- frontend ---"
  ls -la frontend/ 2>/dev/null | head -15 || true
fi
echo "::endgroup::"
