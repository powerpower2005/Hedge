from datetime import date

from common.bars_errors import BarsFetchError, exit_code_for_stats, failure_from_exception
from common.bars_sync import SyncStats, run_bars_sync


def test_bars_fetch_error_str_includes_phase_and_range():
    err = BarsFetchError(
        phase="googfinance_empty",
        symbol="NASDAQ:TSLA",
        start=date(2026, 4, 1),
        end=date(2026, 4, 30),
        message="no rows",
        detail="formula=...",
        instrument="US/NASDAQ/TSLA",
    )
    s = str(err)
    assert "phase=googfinance_empty" in s
    assert "NASDAQ:TSLA" in s
    assert "2026-04-01..2026-04-30" in s
    assert "US/NASDAQ/TSLA" in s


def test_failure_from_bars_fetch_error():
    err = BarsFetchError(
        phase="sheets_read",
        symbol="KOSDAQ:035420",
        start=date(2026, 1, 1),
        end=date(2026, 1, 31),
        message="timeout",
        detail="poll 3/12",
    )
    f = failure_from_exception(("KR", "KOSDAQ", "035420"), "KOSDAQ:035420", err)
    assert f.phase == "sheets_read"
    assert f.instrument == "KR/KOSDAQ/035420"
    assert f.detail == "poll 3/12"


def test_exit_code_fails_on_any_error_by_default():
    stats = SyncStats(instruments=3, updated=2, fetch_errors=1)
    assert exit_code_for_stats(stats) == 1


def test_exit_code_allow_partial():
    stats = SyncStats(instruments=3, updated=2, fetch_errors=1)
    assert exit_code_for_stats(stats, allow_partial=True) == 0


def test_run_bars_sync_records_failure_on_fetch_error(monkeypatch, capsys):
    def _fail_batch(jobs):
        raise BarsFetchError(
            phase="googfinance_empty",
            symbol=jobs[0].symbol,
            start=jobs[0].start,
            end=jobs[0].end,
            message="test failure",
            detail="snapshot=empty",
        )

    monkeypatch.setattr("common.bars_sync.fetch_bars_google_finance_batch", _fail_batch)
    monkeypatch.setattr(
        "common.bars_sync.fetch_bars_google_finance",
        lambda symbol, start, end: (_ for _ in ()).throw(
            BarsFetchError(
                phase="googfinance_empty",
                symbol=symbol,
                start=start,
                end=end,
                message="test failure",
                detail="snapshot=empty",
            )
        ),
    )
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
    stats = run_bars_sync(picks, mode="backfill", dry_run=False, touch_meta=False)
    assert stats.fetch_errors == 1
    assert len(stats.failures) == 1
    assert stats.failures[0].phase == "googfinance_empty"
    captured = capsys.readouterr()
    assert "[bars] FAILURE" in captured.err
    assert "::error title=Bars failed" in captured.err
