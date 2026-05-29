"""Refresh PriceLookup-jp-v1 D/E/F from Yahoo before daily judgment (register_pick pattern)."""

from __future__ import annotations

import sys

from common.sheets import WORKSHEET_JP_NAME, apply_jp_quote_to_row, get_worksheet
from common.yahoo_jp import fetch_jp_quote


def refresh_all_jp_price_rows() -> tuple[int, int, int]:
    """Return (ok, fail, skip) counts."""
    ws = get_worksheet(worksheet=WORKSHEET_JP_NAME)
    rows = ws.get_all_values()
    ok = fail = skip = 0
    for row_index, row in enumerate(rows[1:], start=2):
        if len(row) < 2:
            skip += 1
            continue
        yahoo_ticker = str(row[1]).strip()
        if not yahoo_ticker:
            skip += 1
            continue
        quote = fetch_jp_quote(yahoo_ticker)
        if quote is None:
            fail += 1
            print(
                f"[refresh_jp_prices] WARN row={row_index} yahoo={yahoo_ticker} fetch failed",
                file=sys.stderr,
            )
            continue
        apply_jp_quote_to_row(row_index, quote)
        ok += 1
        print(
            f"[refresh_jp_prices] OK row={row_index} yahoo={yahoo_ticker} "
            f"close={quote.previous_close} session={quote.session_date}",
            file=sys.stderr,
        )
    return ok, fail, skip


def main() -> None:
    try:
        ok, fail, skip = refresh_all_jp_price_rows()
    except Exception as e:
        print(f"[refresh_jp_prices] ERROR: {e}", file=sys.stderr)
        sys.exit(1)
    print(f"[refresh_jp_prices] done ok={ok} fail={fail} skip={skip}")
    if ok == 0 and fail > 0:
        sys.exit(1)


if __name__ == "__main__":
    main()
