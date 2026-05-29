from unittest.mock import MagicMock, patch

from common.yahoo_jp import JpQuote

import refresh_jp_prices as mod


@patch("refresh_jp_prices.apply_jp_quote_to_row")
@patch("refresh_jp_prices.fetch_jp_quote")
@patch("refresh_jp_prices.get_worksheet")
def test_refresh_all_jp_price_rows(mock_get_ws, mock_fetch, mock_apply):
    mock_get_ws.return_value.get_all_values.return_value = [
        ["pick_id", "ticker", "market", "close", "name", "session"],
        ["49", "7012.T", "TYO", "3000", "KHI", "2026-05-28"],
        ["53", "6981.T", "TYO", "PENDING", "", ""],
        ["", "", "", "", "", ""],
    ]
    quote = JpQuote(previous_close=3194.0, name="KHI", session_date="2026-05-29")
    mock_fetch.side_effect = [quote, None]

    ok, fail, skip = mod.refresh_all_jp_price_rows()

    assert ok == 1
    assert fail == 1
    assert skip == 1
    mock_apply.assert_called_once_with(2, quote)
    mock_fetch.assert_any_call("7012.T")
    mock_fetch.assert_any_call("6981.T")


def test_main_exits_when_all_fetch_fail():
    with patch.object(mod, "refresh_all_jp_price_rows", return_value=(0, 2, 0)):
        try:
            mod.main()
            raised = False
        except SystemExit as e:
            raised = e.code == 1
    assert raised
