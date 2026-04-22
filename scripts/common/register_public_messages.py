"""Public-facing registration error text (no secrets, no issue body)."""

from __future__ import annotations

from pathlib import Path
from typing import Optional

GOOGLE_FINANCE_VERIFY_TIP = (
    "If you believe the values are correct, confirm the **exchange-style prefix** "
    "and **ticker** on [Google Finance](https://www.google.com/finance/) "
    "(Korea should use **KRX**, e.g. `KRX:005930`, matching what `GOOGLEFINANCE` expects)."
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
    exc: BaseException,
    *,
    ticker: str,
    market: str,
    row_index: Optional[int],
    last_raw: Optional[str],
) -> str:
    """Human + technical summary for issue comment / CI logs."""
    attr = f"{market}:{ticker}".replace("`", "'")
    lines = [
        "Google Sheets **previous close** (column D, GOOGLEFINANCE `closeyest`) never became a numeric value after **5** reads (~10s, 2s apart).",
        "",
        f"- **GOOGLEFINANCE attribute:** `{attr}` (columns **C=market**, **B=ticker**; **D**=closeyest, **E**=optional `name` on the new row).",
        "For **KR** picks, column **B** is written as a string formula so **leading zeros** in tickers (e.g. `005930`) are not lost; if B became a plain number, Sheets would build `KRX:5930` and `GOOGLEFINANCE` returns **N/A**.",
    ]
    if row_index is not None:
        lines.append(f"- **Row index** (1-based, tab `PriceLookup-v1`): **{row_index}**")
    else:
        lines.append("- **Row index:** row was not appended (failed earlier — see Detail).")
    lines.append(f"- **Last raw value in D:** `{last_raw}`")
    lines.extend(["", f"- **Exception:** `{type(exc).__name__}`"])
    detail = scrub_machine_paths(str(exc).strip())
    if detail:
        lines.append(f"- **Detail:** `{detail}`")
    lines.extend(
        [
            "",
            "Verify in the sheet that a test cell with:",
            f"`=IFERROR(GOOGLEFINANCE(\"{attr}\",\"closeyest\"),\"N/A\")`",
            "Registration uses **`closeyest`** (previous session official close), not intraday `price`. Bare `close` without dates is historical-oriented and often `#N/A` via API. Wrong exchange or unsupported symbol is another common cause.",
            "",
            GOOGLE_FINANCE_VERIFY_TIP,
        ]
    )
    return "\n".join(lines)
