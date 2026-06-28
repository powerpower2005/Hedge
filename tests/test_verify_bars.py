from datetime import date
from unittest.mock import patch

import pytest


def test_verify_bars_weekend_exits_before_verify(monkeypatch):
    monkeypatch.setattr("verify_bars.today_by_country", lambda c: date(2026, 6, 28))

    def _boom(*args, **kwargs):
        raise AssertionError("verify_bars_for_picks should not run on weekend skip")

    monkeypatch.setattr("verify_bars.verify_bars_for_picks", _boom)

    import verify_bars

    with patch.object(verify_bars.sys, "argv", ["verify_bars.py", "--country", "KR"]):
        with pytest.raises(SystemExit) as exc:
            verify_bars.main()
    assert exc.value.code == 0
