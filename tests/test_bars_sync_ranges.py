from datetime import date

from common.bars_sync import plan_fetch_windows, run_bars_sync


def test_run_bars_sync_dry_run_skips_jp():
    picks = [
        {
            "country": "JP",
            "market": "TYO",
            "ticker": "7203",
            "status": {"current": "active"},
            "entry": {"date": "2026-04-01"},
            "duration": {"deadline": "2026-07-01"},
        },
    ]
    stats = run_bars_sync(picks, mode="backfill", dry_run=True, touch_meta=False)
    assert stats.instruments == 0
    assert stats.skipped_jp == 1


def test_plan_fetch_windows_backfill_chunks():
    key = ("US", "NASDAQ", "TSLA")
    picks = [
        {
            "entry": {"date": "2026-01-01"},
            "duration": {"deadline": "2026-06-01"},
        }
    ]
    windows = plan_fetch_windows(key, picks, date(2026, 6, 1), "backfill")
    assert len(windows) >= 2
    assert windows[0][0] == date(2026, 1, 1)
