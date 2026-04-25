"""Public-facing registration error text (no secrets, no issue body)."""

from __future__ import annotations

from pathlib import Path
from typing import Optional

from .models import market_for_google_finance

GOOGLE_FINANCE_VERIFY_TIP = (
    "If you believe the values are correct, confirm the **ticker** and **exchange** on [Google Finance](https://www.google.com/finance/). "
    "For **KR** and **US**, registration may try several **exchange prefixes** automatically until a previous close is found."
)


def scrub_machine_paths(text: str) -> str:
    out = text.replace("\\", "/")
    for noise in ("/home/runner/work/", "/github/workspace/"):
        out = out.replace(noise, ".../")
    try:
        cwd = str(Path.cwd()).replace("\\", "/")
        if cwd and cwd != "/":
            out = out.replace(cwd, ".")
    except OSError:
        pass
    if len(out) > 500:
        out = out[:500] + "…"
    return out


def format_price_fetch_public(
    *,
    ticker: str,
    market: str,
    tried_prefixes: Optional[list[str]] = None,
) -> str:
    """Short text for the GitHub issue comment (user-facing only)."""
    safe_ticker = str(ticker).replace("`", "'")
    chain_md = " → ".join(f"`{p}`" for p in tried_prefixes) if tried_prefixes else ""
    tip_actions = (
        "- **EN:** More technical detail for this run is in the repository **Actions** log (workflow run for this issue).\n"
        "- **한:** 이 실행에 대한 자세한 기술 정보는 저장소 **Actions** 에서 이 이슈와 연결된 워크플로 실행 로그를 확인하세요."
    )
    if tried_prefixes:
        return "\n".join(
            [
                "### Registration failed (price) / 등록 실패 (가격 확인)",
                "",
                f"- **EN:** Registration tried these **exchange prefixes** in order: {chain_md} for **`{safe_ticker}`**, "
                "but **none** returned a usable **previous-day close** in time.",
                f"- **한:** **`{safe_ticker}`** 에 대해 거래소 접두를 다음 순서로 시도했습니다: {chain_md}. "
                "등록에 필요한 **전일 종가**를 제한 시간 안에 가져오지 못했습니다.",
                "",
                "- **EN:** Please double-check **ticker and market** on [Google Finance](https://www.google.com/finance/).",
                "- **한:** [Google Finance](https://www.google.com/finance/)에서 **티커·시장**을 다시 확인해 주세요.",
                "",
                tip_actions,
            ]
        )
    return "\n".join(
        [
            "### Registration failed (price) / 등록 실패 (가격 확인)",
            "",
            f"- **EN:** Could not confirm a usable **previous-day close** for **`{safe_ticker}`** (form market: **`{market}`**). "
            "Please verify **ticker and exchange** on [Google Finance](https://www.google.com/finance/).",
            f"- **한:** **`{safe_ticker}`** (양식 시장 **{market}**)의 등록용 전일 종가를 확인하지 못했습니다. "
            "[Google Finance](https://www.google.com/finance/)에서 티커·거래소를 확인해 주세요.",
            "",
            tip_actions,
        ]
    )


def format_price_fetch_ops_log(
    exc: BaseException,
    *,
    ticker: str,
    market: str,
    row_index: Optional[int],
    last_raw: Optional[str],
    tried_prefixes: Optional[list[str]] = None,
    country: Optional[str] = None,
) -> str:
    """Verbose sheet/API context for Actions stderr only (not posted to the issue)."""
    chain_md = " → ".join(f"`{p}`" for p in tried_prefixes) if tried_prefixes else ""
    if tried_prefixes:
        fin_market = tried_prefixes[-1]
        attr = f"{fin_market}:{ticker}".replace("`", "'")
        prefix_note = (
            f"- Exchange prefixes tried (column C): {chain_md} "
            "(column C was set in order until closeyest became numeric; last state in attr below)."
        )
    else:
        fin_market = market_for_google_finance(market)
        attr = f"{fin_market}:{ticker}".replace("`", "'")
        prefix_note = None

    lines = [
        "=== register_pick: Google Sheet / API detail (stderr only) ===",
        "",
        "Google Sheets previous close (column D, GOOGLEFINANCE closeyest) never became a numeric value after 8 reads "
        "(~2s apart, plus a short wait after the row was appended).",
        "",
        f"- GOOGLEFINANCE attribute (columns C+B): `{attr}`",
    ]
    if prefix_note:
        lines.append(prefix_note)
    elif market != fin_market:
        lines.append(
            f"- Form market `{market}` -> column C written as `{fin_market}` (KR mapping)."
        )
    if country == "KR":
        lines.append(
            "KR: column B is a string formula for leading zeros; plain number in B breaks KRX:ticker."
        )
    elif country == "US":
        lines.append("US: column B is raw ticker combined with column C in GOOGLEFINANCE(C:B, ...).")
    if row_index is not None:
        lines.append(f"- Row index (1-based, tab PriceLookup-v1): {row_index}")
    else:
        lines.append("- Row index: not available (failed before append).")
    lines.append(f"- Last raw value in D: {last_raw!r}")
    lines.append(f"- Exception: {type(exc).__name__}")
    detail = scrub_machine_paths(str(exc).strip())
    if detail:
        lines.append(f"- Detail: {detail}")
    lines.extend(
        [
            "",
            "Test formula (sheet):",
            f'=IFERROR(GOOGLEFINANCE("{attr}","closeyest"),"N/A")',
            "Registration uses closeyest (previous session official close).",
        ]
    )
    return "\n".join(lines)
