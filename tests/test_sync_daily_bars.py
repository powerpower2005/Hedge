from datetime import date
from unittest.mock import patch

import pytest


def test_sync_daily_bars_weekend_exits_before_sync(monkeypatch):
    monkeypatch.setattr("sync_daily_bars.today_by_country", lambda c: date(2026, 6, 27))

    def _boom(*args, **kwargs):
        raise AssertionError("run_bars_sync should not run on weekend skip")

    monkeypatch.setattr("sync_daily_bars.run_bars_sync", _boom)

    import sync_daily_bars

    with patch.object(sync_daily_bars.sys, "argv", ["sync_daily_bars.py", "--country", "KR"]):
        with pytest.raises(SystemExit) as exc:
            sync_daily_bars.main()
    assert exc.value.code == 0
