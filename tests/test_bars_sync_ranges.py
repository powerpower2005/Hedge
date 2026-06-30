from datetime import date, timedelta

from common.bars_constants import DETAIL_TRADING_BARS, detail_calendar_lookback_start
from common.bars_sync import (
    fetch_floor_start,
    is_bars_fully_synced,
    plan_fetch_windows,
    run_bars_sync,
)
from common.instrument_key import bars_file_path

def test_run_bars_sync_dry_run_plans_without_fetch(monkeypatch):
    calls: list[tuple] = []

    def _boom(*args, **kwargs):
        calls.append(args)
        raise AssertionError("fetch should not run in dry-run")

    monkeypatch.setattr("common.bars_sync.fetch_bars_google_finance_batch", _boom)
    picks = [
        {
            "country": "US",
            "market": "NASDAQ",
            "ticker": "TSLA",
            "status": {"current": "active"},
            "entry": {"date": "2026-04-01"},
            "duration": {"deadline": "2026-07-01"},
        },
    ]
    stats = run_bars_sync(picks, mode="backfill", dry_run=True, touch_meta=False)
    assert stats.instruments == 1
    assert stats.updated == 1
    assert calls == []


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


def test_plan_fetch_windows_backfill_chunks(tmp_path, monkeypatch):
    from common import bars_storage

    key = ("US", "NASDAQ", "TSLA")
    root = tmp_path / "data" / "bars" / "v1"
    monkeypatch.setattr(bars_storage, "BARS_ROOT", root)
    monkeypatch.setattr(
        "common.bars_sync.bars_file_path",
        lambda k, root=None, _root=root: bars_file_path(k, root=_root),
    )
    picks = [
        {
            "entry": {"date": "2026-01-01"},
            "duration": {"deadline": "2026-06-01"},
        }
    ]
    windows = plan_fetch_windows(key, picks, date(2026, 6, 1), "backfill")
    assert len(windows) >= 2
    assert windows[0][0] == fetch_floor_start(picks, date(2026, 6, 1))
    assert windows[-1][1] == date(2026, 6, 1)


def test_fetch_floor_start_extends_before_recent_entry():
    picks = [
        {
            "entry": {"date": "2026-06-23"},
            "duration": {"deadline": "2026-07-07"},
        }
    ]
    today = date(2026, 6, 25)
    floor = fetch_floor_start(picks, today)
    assert floor == detail_calendar_lookback_start(today)
    assert floor < date(2026, 6, 23)


def test_plan_fetch_windows_recent_entry_backfills_detail_lookback(tmp_path, monkeypatch):
    from common import bars_storage

    key = ("US", "NASDAQ", "BTQ")
    root = tmp_path / "data" / "bars" / "v1"
    monkeypatch.setattr(bars_storage, "BARS_ROOT", root)
    monkeypatch.setattr(
        "common.bars_sync.bars_file_path",
        lambda k, root=None, _root=root: bars_file_path(k, root=_root),
    )
    picks = [
        {
            "entry": {"date": "2026-06-23"},
            "duration": {"deadline": "2026-07-07"},
        }
    ]
    today = date(2026, 6, 25)
    windows = plan_fetch_windows(key, picks, today, "backfill")
    assert windows
    assert windows[0][0] == detail_calendar_lookback_start(today)
    assert windows[-1][1] == today


def test_plan_fetch_windows_daily_chunks_lookback_and_forward(tmp_path, monkeypatch):
    from common import bars_storage

    key = ("KR", "KOSDAQ", "036620")
    root = tmp_path / "data" / "bars" / "v1"
    path = bars_file_path(key, root=root)
    doc = bars_storage.empty_bars_document(key)
    doc["bars"] = [
        {"date": "2026-05-08", "open": 1, "high": 2, "low": 0.5, "close": 1.5},
        {"date": "2026-06-26", "open": 1, "high": 2, "low": 0.5, "close": 1.5},
    ]
    bars_storage.save_bars_document(path, doc)
    monkeypatch.setattr(bars_storage, "BARS_ROOT", root)
    monkeypatch.setattr(
        "common.bars_sync.bars_file_path",
        lambda k, root=None, _root=root: bars_file_path(k, root=_root),
    )
    picks = [
        {
            "entry": {"date": "2026-05-08"},
            "duration": {"deadline": "2026-08-06"},
        }
    ]
    today = date(2026, 6, 30)
    windows = plan_fetch_windows(key, picks, today, "daily")
    assert len(windows) >= 3
    max_span_days = max((end - start).days for start, end in windows)
    assert max_span_days <= 89
    assert not any(
        start == detail_calendar_lookback_start(today) and end == today
        for start, end in windows
    )


def test_is_bars_fully_synced(tmp_path, monkeypatch):
    from common import bars_storage

    key = ("US", "NASDAQ", "TSLA")
    root = tmp_path / "data" / "bars" / "v1"
    path = bars_file_path(key, root=root)
    today = date(2026, 6, 25)
    floor = detail_calendar_lookback_start(today)
    bars = [
        {
            "date": (floor + timedelta(days=i)).isoformat(),
            "open": 1,
            "high": 2,
            "low": 0.5,
            "close": 1.5,
        }
        for i in range(DETAIL_TRADING_BARS)
    ]
    bars[-1]["date"] = today.isoformat()
    bars_storage.save_bars_document(
        path,
        {
            "schema_version": "1.0.0",
            "generator": {"name": "test", "version": "0"},
            "generated_at": "2026-06-25T00:00:00Z",
            "instrument": {"country": "US", "market": "NASDAQ", "ticker": "TSLA"},
            "source": "google_sheets_googfinance",
            "updated_at": today.isoformat(),
            "bars": bars,
        },
    )
    monkeypatch.setattr(bars_storage, "BARS_ROOT", root)
    monkeypatch.setattr(
        "common.bars_sync.bars_file_path",
        lambda k, root=None, _root=root: bars_file_path(k, root=_root),
    )
    picks = [{"entry": {"date": "2026-04-01"}, "duration": {"deadline": "2026-07-01"}}]
    assert is_bars_fully_synced(key, picks, today)
