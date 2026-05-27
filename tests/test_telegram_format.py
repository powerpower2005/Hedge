from common.telegram_format import format_judgment_digest, format_new_pick_message
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
    text = format_judgment_digest("US", "2026-05-26", [pick], [move])
    assert "[US 일일 하이라이트]" in text
    assert "🎯 목표 임박" in text
    assert "📈 큰 움직임" in text
    assert "AAPL" in text


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
