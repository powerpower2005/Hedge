from datetime import date

from common.bars_storage import merge_bars, upsert_bars
from common.bars_sync import group_instruments, instrument_date_window, plan_fetch_windows
from common.instrument_key import bars_file_path, finance_symbol, instrument_key_from_pick


def test_instrument_key_from_pick():
    pick = {"country": "US", "market": "NASDAQ", "ticker": "TSLA"}
    assert instrument_key_from_pick(pick) == ("US", "NASDAQ", "TSLA")
    assert bars_file_path(("US", "NASDAQ", "TSLA")).as_posix().endswith("data/bars/v1/US/NASDAQ/TSLA.json")


def test_finance_symbol():
    assert finance_symbol("US", "NASDAQ", "AAPL") == "NASDAQ:AAPL"
    assert finance_symbol("KR", "KOSDAQ", "035420") == "KOSDAQ:035420"
    assert finance_symbol("HK", "HKG", "0700") == "HKG:0700"


def test_merge_bars_upsert_and_sort():
    existing = [
        {"date": "2026-04-01", "open": 1, "high": 2, "low": 0.5, "close": 1.5},
    ]
    incoming = [
        {"date": "2026-04-02", "open": 2, "high": 3, "low": 1.5, "close": 2.5},
        {"date": "2026-04-01", "open": 1, "high": 2.5, "low": 0.5, "close": 2},
    ]
    merged, changed = merge_bars(existing, incoming)
    assert changed
    assert [b["date"] for b in merged] == ["2026-04-01", "2026-04-02"]
    assert merged[0]["close"] == 2


def test_merge_bars_volume_optional():
    a = [{"date": "2026-04-01", "open": 1, "high": 2, "low": 0.5, "close": 1.5, "volume": 100}]
    b = [{"date": "2026-04-01", "open": 1, "high": 2, "low": 0.5, "close": 1.5}]
    merged, changed = merge_bars(a, b)
    assert changed
    assert "volume" not in merged[0]


def test_group_instruments_dedupes_same_ticker(tmp_path, monkeypatch):
    picks = [
        {
            "country": "US",
            "market": "NASDAQ",
            "ticker": "TSLA",
            "status": {"current": "active"},
            "entry": {"date": "2026-04-01"},
            "duration": {"deadline": "2026-07-01"},
        },
        {
            "country": "US",
            "market": "NASDAQ",
            "ticker": "TSLA",
            "status": {"current": "active"},
            "entry": {"date": "2026-04-10"},
            "duration": {"deadline": "2026-08-01"},
        },
        {
            "country": "JP",
            "market": "TYO",
            "ticker": "7203",
            "status": {"current": "active"},
            "entry": {"date": "2026-04-01"},
            "duration": {"deadline": "2026-07-01"},
        },
    ]
    grouped = group_instruments(picks)
    assert len(grouped) == 1
    assert ("US", "NASDAQ", "TSLA") in grouped
    assert len(grouped[("US", "NASDAQ", "TSLA")]) == 2


def test_instrument_date_window_union():
    picks = [
        {
            "entry": {"date": "2026-04-01"},
            "duration": {"deadline": "2026-07-01"},
        },
        {
            "entry": {"date": "2026-04-15"},
            "duration": {"deadline": "2026-08-01"},
        },
    ]
    today = date(2026, 6, 25)
    start, end = instrument_date_window(picks, today)
    assert start == date(2026, 4, 1)
    assert end == date(2026, 6, 25)


def test_plan_fetch_windows_daily_resumes_after_last_bar(tmp_path, monkeypatch):
    from common import bars_storage

    key = ("US", "NASDAQ", "TSLA")
    path = bars_file_path(key, root=tmp_path / "data" / "bars" / "v1")
    doc = bars_storage.empty_bars_document(key)
    doc["bars"] = [
        {"date": "2026-04-01", "open": 1, "high": 2, "low": 0.5, "close": 1.5},
    ]
    bars_storage.save_bars_document(path, doc)
    monkeypatch.setattr(bars_storage, "BARS_ROOT", tmp_path / "data" / "bars" / "v1")
    monkeypatch.setattr("common.bars_sync.bars_file_path", lambda k, root=None: bars_file_path(k, root=tmp_path / "data" / "bars" / "v1"))

    picks = [
        {
            "entry": {"date": "2026-04-01"},
            "duration": {"deadline": "2026-07-01"},
        }
    ]
    today = date(2026, 4, 20)
    windows = plan_fetch_windows(key, picks, today, "daily")
    assert windows
    assert windows[0][0] == date(2026, 4, 2)


def test_upsert_bars_writes_file(tmp_path, monkeypatch):
    from common import bars_storage

    root = tmp_path / "data" / "bars" / "v1"
    monkeypatch.setattr(bars_storage, "BARS_ROOT", root)
    key = ("US", "NASDAQ", "AAPL")
    changed = upsert_bars(
        key,
        [{"date": "2026-04-01", "open": 1, "high": 2, "low": 0.5, "close": 1.5}],
        root=root,
    )
    assert changed
    path = bars_file_path(key, root=root)
    assert path.exists()
    doc = bars_storage.load_bars_file(path)
    assert doc["updated_at"] == "2026-04-01"
    assert len(doc["bars"]) == 1
