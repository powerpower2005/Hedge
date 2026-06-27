from datetime import date

from common.bars_storage import save_bars_document
from common.bars_verify import (
    exit_code_for_verify,
    verify_bars_for_picks,
    verify_instrument,
)
from common.instrument_key import bars_file_path


def _pick(entry: str, deadline: str) -> dict:
    return {
        "country": "US",
        "market": "NASDAQ",
        "ticker": "TSLA",
        "status": {"current": "active"},
        "entry": {"date": entry},
        "duration": {"deadline": deadline},
    }


def test_verify_missing_file(tmp_path):
    picks = [_pick("2026-04-01", "2026-07-01")]
    stats = verify_bars_for_picks(picks, today=date(2026, 6, 25), root=tmp_path / "bars")
    assert stats.instruments == 1
    assert stats.ok == 0
    assert stats.errors == 1
    assert stats.issues[0].code == "missing_file"


def test_verify_empty_bars(tmp_path):
    key = ("US", "NASDAQ", "TSLA")
    path = bars_file_path(key, root=tmp_path / "bars")
    save_bars_document(
        path,
        {
            "schema_version": "1.0.0",
            "generator": {"name": "test", "version": "0"},
            "generated_at": "2026-06-25T00:00:00Z",
            "instrument": {"country": "US", "market": "NASDAQ", "ticker": "TSLA"},
            "source": "google_sheets_googfinance",
            "updated_at": "1970-01-01",
            "bars": [],
        },
    )
    picks = [_pick("2026-04-01", "2026-07-01")]
    stats = verify_bars_for_picks(picks, today=date(2026, 6, 25), root=tmp_path / "bars")
    assert stats.errors == 1
    assert stats.issues[0].code == "empty_bars"


def test_verify_empty_ohlc(tmp_path):
    key = ("US", "NASDAQ", "TSLA")
    path = bars_file_path(key, root=tmp_path / "bars")
    save_bars_document(
        path,
        {
            "schema_version": "1.0.0",
            "generator": {"name": "test", "version": "0"},
            "generated_at": "2026-06-25T00:00:00Z",
            "instrument": {"country": "US", "market": "NASDAQ", "ticker": "TSLA"},
            "source": "google_sheets_googfinance",
            "updated_at": "2026-04-01",
            "bars": [
                {"date": "2026-04-01", "open": 1, "high": 2, "low": 0.5, "close": "N/A"},
            ],
        },
    )
    issues = verify_instrument(key, [_pick("2026-04-01", "2026-07-01")], today=date(2026, 6, 25), root=tmp_path / "bars")
    codes = {i.code for i in issues}
    assert "empty_ohlc" in codes


def test_verify_short_detail_history_warning(tmp_path):
    key = ("US", "NASDAQ", "TSLA")
    path = bars_file_path(key, root=tmp_path / "bars")
    save_bars_document(
        path,
        {
            "schema_version": "1.0.0",
            "generator": {"name": "test", "version": "0"},
            "generated_at": "2026-06-25T00:00:00Z",
            "instrument": {"country": "US", "market": "NASDAQ", "ticker": "TSLA"},
            "source": "google_sheets_googfinance",
            "updated_at": "2026-06-24",
            "bars": [
                {"date": "2026-06-23", "open": 1, "high": 2, "low": 0.5, "close": 1.5},
                {"date": "2026-06-24", "open": 2, "high": 3, "low": 1.5, "close": 2.5},
            ],
        },
    )
    stats = verify_bars_for_picks(
        [_pick("2026-06-23", "2026-07-07")],
        today=date(2026, 6, 25),
        root=tmp_path / "bars",
    )
    codes = {i.code for i in stats.issues}
    assert "short_detail_history" in codes


def test_verify_ok_and_stale_warning(tmp_path):
    key = ("US", "NASDAQ", "TSLA")
    path = bars_file_path(key, root=tmp_path / "bars")
    save_bars_document(
        path,
        {
            "schema_version": "1.0.0",
            "generator": {"name": "test", "version": "0"},
            "generated_at": "2026-06-25T00:00:00Z",
            "instrument": {"country": "US", "market": "NASDAQ", "ticker": "TSLA"},
            "source": "google_sheets_googfinance",
            "updated_at": "2026-06-20",
            "bars": [
                {"date": "2026-06-20", "open": 1, "high": 2, "low": 0.5, "close": 1.5},
            ],
        },
    )
    stats = verify_bars_for_picks(
        [_pick("2026-04-01", "2026-07-01")],
        today=date(2026, 6, 25),
        root=tmp_path / "bars",
    )
    assert stats.ok == 1
    assert stats.errors == 0
    assert stats.warnings == 2
    codes = {i.code for i in stats.issues}
    assert codes == {"stale_through", "short_detail_history"}
    assert exit_code_for_verify(stats) == 0
    assert exit_code_for_verify(stats, fail_on_warning=True) == 1
