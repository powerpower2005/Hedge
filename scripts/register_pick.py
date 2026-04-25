"""Register a new pick from a GitHub Issue (form body)."""

from __future__ import annotations

import json
import os
import sys
import time
from typing import cast
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

from common.github_api import (
    add_issue_comment,
    add_issue_label,
    remove_issue_label,
)
from common.issue_parse import normalized_fields, parse_issue_form
from common.issue_pick_lookup import find_pick_by_issue_number
from common.meta import bump_next_pick_id, peek_next_pick_id
from common.register_public_messages import (
    GOOGLE_FINANCE_VERIFY_TIP,
    format_price_fetch_ops_log,
    format_price_fetch_public,
)
from common.goog_finance_parse import parse_instrument_name_cell
from common.models import (
    kr_googlefinance_prefix_candidates,
    market_for_google_finance,
    us_googlefinance_prefix_candidates,
)
from common.sheets import (
    append_ticker_row,
    delete_row_for_pick_id,
    read_close_at_row,
    read_instrument_name_at_row,
    set_price_lookup_finance_prefix,
)
from common.storage import get_picks, load_list_file, save_list_file
from common.validation import (
    ValidationError,
    validate_no_duplicate_ticker,
    validate_pick_input,
    validate_user_quota,
)
from common.versioning import now_iso, read_current_commit, read_engine_version

ACTIVE_PATH = Path("data/active.json")


def _load_issue_body() -> str:
    path = os.getenv("GITHUB_EVENT_PATH")
    if path and os.path.isfile(path):
        with open(path, encoding="utf-8") as f:
            return (json.load(f).get("issue") or {}).get("body") or ""
    return os.getenv("ISSUE_BODY") or ""


def _format_money(country: str, price: float) -> str:
    if country == "KR":
        return f"₩{price:,.0f}"
    return f"${price:.2f}"


def fail(code: str, message: str, issue_number: int) -> None:
    body = f"""**Registration failed** (`{code}`)

{message}

{GOOGLE_FINANCE_VERIFY_TIP}

Please fix the form and open a new issue if needed.  
양식을 바로잡거나, 필요하면 **새 이슈**로 다시 제출해 주세요.
"""
    print(f"[register_pick] FAILED {code}\n{message}", file=sys.stderr)
    add_issue_comment(issue_number, body)
    add_issue_label(issue_number, "invalid")
    sys.exit(1)


def build_pick(
    pick_id: int,
    author: str,
    issue_number: int,
    ticker: str,
    country: str,
    market: str,
    target_return: float,
    duration_days: int,
    entry_price: float,
    *,
    instrument_name: str | None = None,
    author_note: str | None = None,
) -> dict:
    entry_date = datetime.now(timezone.utc).date()
    deadline = entry_date + timedelta(days=duration_days)
    target_price = round(entry_price * (1 + target_return), 4)
    out: dict = {
        "id": pick_id,
        "schema_version": "1.0.0",
        "created_with": {
            "engine_version": read_engine_version(),
            "rules_version": "1.0.1",
            "commit": read_current_commit(),
        },
        "created_at": now_iso(),
        "author": author,
        "issue_number": issue_number,
        "ticker": ticker,
        "country": country,
        "market": market,
        "entry": {
            "price": entry_price,
            "date": entry_date.isoformat(),
            "source": "google_sheets",
        },
        "target": {
            "return_rate": target_return,
            "price": target_price,
        },
        "duration": {
            "days": duration_days,
            "deadline": deadline.isoformat(),
        },
        "status": {
            "current": "active",
            "history": [
                {
                    "status": "active",
                    "at": now_iso(),
                    "engine_version": read_engine_version(),
                    "reason": "initial_registration",
                }
            ],
        },
        "progress": {
            "updated_at": entry_date.isoformat(),
            "current": {"close": entry_price, "return_rate": 0.0},
            "highest": {
                "close": entry_price,
                "close_date": entry_date.isoformat(),
                "return_rate": 0.0,
            },
            "distance_to_target": target_return,
            "error_count": 0,
        },
        "votes": {"likes": 0, "dislikes": 0, "last_synced": now_iso()},
        "extensions": {},
    }
    if instrument_name:
        out["instrument_name"] = instrument_name
    if author_note:
        out["author_note"] = author_note
    return out


def _parse_close_value(raw: str | None) -> float:
    if raw is None or raw in ("", "N/A", "#N/A", "#VALUE!"):
        raise ValueError("invalid close")
    return float(str(raw).replace(",", ""))


def main() -> None:
    issue_number = int(os.environ["ISSUE_NUMBER"])
    author = os.environ["ISSUE_AUTHOR"]
    body = _load_issue_body()
    raw = parse_issue_form(body)
    try:
        fields = normalized_fields(raw)
    except (KeyError, ValueError) as e:
        fail("PARSE_ERROR", f"Could not read issue form fields: {e}", issue_number)

    ticker = fields["ticker"]
    country = fields["country"]
    market = fields["market"]
    target_return = fields["target_return"]
    duration_days = fields["duration_days"]
    target_return_pct = fields["target_return"] * 100

    try:
        validate_pick_input(ticker, country, market, target_return, duration_days)
    except ValidationError as e:
        fail(e.code, e.message, issue_number)

    prior = find_pick_by_issue_number(issue_number)
    if prior is not None:
        print(
            f"[register_pick] IDEMPOTENT issue={issue_number} pick_id={prior.get('id')} "
            f"status={prior.get('status', {}).get('current')} — skip (already recorded).",
            file=sys.stderr,
        )
        sys.exit(0)

    active_data = load_list_file(ACTIVE_PATH)
    active_picks = get_picks(active_data)
    try:
        validate_user_quota(author, active_picks)
        validate_no_duplicate_ticker(author, ticker, active_picks)
    except ValidationError as e:
        fail(e.code, e.message, issue_number)

    if country == "KR":
        finance_candidates = kr_googlefinance_prefix_candidates(market)
    elif country == "US":
        finance_candidates = us_googlefinance_prefix_candidates(market)
    else:
        finance_candidates = [market_for_google_finance(market)]
    resolved_sheet_prefix: str | None = None
    tried_chain: list[str] = []
    entry_price: float | None = None

    pick_id = peek_next_pick_id()
    row_index: int | None = None
    raw_close: str | None = None
    try:
        row_index = append_ticker_row(
            pick_id,
            ticker,
            market,
            country,
            finance_exchange=finance_candidates[0],
        )
        print(
            f"[register_pick] SHEETS_APPEND_OK pick_id={pick_id} worksheet_row={row_index} tab=PriceLookup-v1",
            file=sys.stderr,
        )
        time.sleep(3)
        for attempt_idx, prefix in enumerate(finance_candidates):
            if attempt_idx > 0:
                set_price_lookup_finance_prefix(row_index, prefix)
                time.sleep(2)
            tried_chain.append(prefix)
            for _ in range(8):
                raw_close = read_close_at_row(row_index)
                try:
                    entry_price = _parse_close_value(raw_close)
                    resolved_sheet_prefix = prefix
                    break
                except ValueError:
                    time.sleep(2)
            if entry_price is not None:
                break
        else:
            raise ValueError(f"close not_ready last={raw_close!r}")
        if country in ("KR", "US") and resolved_sheet_prefix:
            print(
                f"[register_pick] SHEETS_FINANCE_PREFIX pick_id={pick_id} country={country} "
                f"prefix={resolved_sheet_prefix} tried={'->'.join(tried_chain)}",
                file=sys.stderr,
            )
        instrument_name: str | None = None
        for _ in range(5):
            raw_name = read_instrument_name_at_row(row_index)
            instrument_name = parse_instrument_name_cell(raw_name)
            if instrument_name:
                break
            time.sleep(1)
    except Exception as e:
        if row_index is not None:
            print(
                f"[register_pick] SHEETS_ROLLBACK try pick_id={pick_id} row={row_index} (delete_row_for_pick_id)",
                file=sys.stderr,
            )
            try:
                delete_row_for_pick_id(pick_id)
                print(f"[register_pick] SHEETS_ROLLBACK_OK pick_id={pick_id}", file=sys.stderr)
            except Exception as del_exc:
                print(f"[register_pick] SHEETS_ROLLBACK_FAIL pick_id={pick_id}: {del_exc}", file=sys.stderr)
        print(
            format_price_fetch_ops_log(
                e,
                ticker=ticker,
                market=market,
                row_index=row_index,
                last_raw=raw_close,
                tried_prefixes=tried_chain if country in ("KR", "US") and tried_chain else None,
                country=country,
            ),
            file=sys.stderr,
        )
        msg = format_price_fetch_public(
            ticker=ticker,
            market=market,
            tried_prefixes=tried_chain if country in ("KR", "US") and tried_chain else None,
        )
        fail("PRICE_FETCH_ERROR", msg, issue_number)

    submitter_note = fields.get("author_note")
    pick = build_pick(
        pick_id,
        author,
        issue_number,
        ticker,
        country,
        market,
        target_return,
        duration_days,
        cast(float, entry_price),
        instrument_name=instrument_name,
        author_note=submitter_note if isinstance(submitter_note, str) else None,
    )
    active_picks.append(pick)
    save_list_file(ACTIVE_PATH, active_picks)
    bump_next_pick_id(pick_id)

    start_s = _format_money(country, cast(float, entry_price))
    target_s = _format_money(country, pick["target"]["price"])
    comment = f"""**Registered**

| Field | Value |
| --- | --- |
| Pick ID | #{pick_id} |
| Ticker | `{ticker}` ({market}) |
| Name | {pick.get("instrument_name") or "—"} |
| Entry | {start_s} |
| Target | {target_s} (+{target_return_pct:.1f}%) |
| Deadline | {pick['duration']['deadline']} ({duration_days} days) |

Daily close check runs around **07:00 KST**. Vote with reactions on issues.
"""
    if country in ("KR", "US") and resolved_sheet_prefix is not None:
        chain = " → ".join(f"`{p}`" for p in tried_chain)
        comment += (
            "\n\n**Exchange prefix (price lookup) / 거래소 접두 (가격 조회)**\n"
            f"- **EN:** **`{resolved_sheet_prefix}`** is the exchange prefix used for the **previous close** (first in the try list that succeeded).\n"
            f"- **한:** **전일 종가** 조회에 **`{resolved_sheet_prefix}`** 거래소 접두를 썼습니다(아래 순서 중 먼저 성공한 접두).\n"
            f"- **Try order:** {chain}\n"
            f"- 양식에서 고른 시장(**{market}**)은 픽에 그대로 저장되며, 위 접두는 가격 조회에만 쓰입니다.\n"
        )
    if submitter_note:
        preview = " ".join(submitter_note.split())
        if len(preview) > 220:
            preview = preview[:217] + "…"
        comment += f"\n**Submitter note** (full text on the pick detail page): {preview}\n"
    add_issue_comment(issue_number, comment)
    try:
        remove_issue_label(issue_number, "pick-submission")
    except Exception:
        pass
    add_issue_label(issue_number, "active")


if __name__ == "__main__":
    main()
