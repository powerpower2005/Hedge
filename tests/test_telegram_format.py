from common.telegram_format import format_achieved_line, format_judgment_digest, format_new_pick_message
from common.telegram_highlights import ReturnMove


def test_format_judgment_digest_includes_sections():
    pick = {
        "id": 9,
        "ticker": "AAPL",
        "instrument_name": "Apple",
        "author": "bob",
        "country": "US",
        "market": "NASDAQ",
        "target": {"return_rate": 0.12},
        "progress": {"distance_to_target": 0.03, "current": {"return_rate": 0.09}},
    }
    move = ReturnMove(pick, 0.05, 0.09)
    text = format_judgment_digest("US", "2026-05-26", [pick], [pick], [move])
    assert "[US 일일 하이라이트]" in text
    assert "🏆 오늘 달성" in text
    assert "🎯 목표 임박" in text
    assert "📈 큰 움직임" in text
    assert "AAPL" in text


def test_format_achieved_line():
    pick = {
        "ticker": "005930",
        "instrument_name": "Samsung",
        "author": "dana",
        "target": {"return_rate": 0.1},
        "achievement": {
            "achieved_date": "2026-05-26",
            "final_return_rate": 0.12,
            "days_taken": 14,
        },
    }
    line = format_achieved_line(pick)
    assert "005930" in line
    assert "+12.0%" in line
    assert "14일" in line


def test_format_new_pick_message():
    pick = {
        "id": 42,
        "ticker": "7203",
        "country": "JP",
        "market": "TYO",
        "author": "carol",
        "created_at": "2026-05-26T10:00:00Z",
        "target": {"return_rate": 0.15},
        "duration": {"days": 30},
    }
    text = format_new_pick_message(pick)
    assert "신규 등록" in text
    assert "7203" in text
    assert "진입 대기" in text
