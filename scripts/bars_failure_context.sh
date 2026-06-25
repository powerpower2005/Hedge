#!/usr/bin/env bash
# Extra CI hints when backfill_bars / sync_daily_bars fails. No secrets.
set +e
echo "::group::Bars failure context (no secrets)"
echo "time_utc=$(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "workflow=${GITHUB_WORKFLOW:-n/a} job=${GITHUB_JOB:-n/a}"
echo "--- grep recent bars log lines from this job (if present) ---"
echo "Look above for lines starting with: [bars] FAILURE, [bars] DETAIL, ::error title=Bars failed"
echo "--- data/bars ---"
if [[ -d data/bars/v1 ]]; then
  count=$(find data/bars/v1 -name '*.json' 2>/dev/null | wc -l | tr -d ' ')
  echo "bar_json_files=${count}"
  find data/bars/v1 -name '*.json' 2>/dev/null | head -20 || true
else
  echo "(no data/bars/v1 yet)"
fi
echo "--- sheets env (presence only) ---"
[[ -n "${GOOGLE_SHEET_ID:-}" ]] && echo "GOOGLE_SHEET_ID=set" || echo "GOOGLE_SHEET_ID=unset"
[[ -f config/service_account.json ]] && echo "service_account_json_file=present" || echo "service_account_json_file=absent"
echo "--- local dry-run (plan only, no network in this snippet) ---"
echo "python scripts/backfill_bars.py --dry-run"
echo "python scripts/sync_daily_bars.py --country KR --dry-run"
echo "::endgroup::"
