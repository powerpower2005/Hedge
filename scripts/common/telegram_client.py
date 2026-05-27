"""Send messages via Telegram Bot API."""

from __future__ import annotations

import os

import requests

from .telegram_config import get_telegram_chat_id, get_telegram_token, telegram_configured

API_BASE = "https://api.telegram.org/bot{token}/sendMessage"
MAX_MESSAGE_LEN = 4096


def send_telegram_message(text: str, *, disable_preview: bool = True) -> None:
    if os.environ.get("TELEGRAM_DISABLE", "").strip().lower() in ("1", "true", "yes"):
        print("[telegram] TELEGRAM_DISABLE set — skip send")
        return
    if not telegram_configured():
        print("[telegram] not configured — skip send")
        return
    body = text.strip()
    if not body:
        print("[telegram] empty message — skip send")
        return
    if len(body) > MAX_MESSAGE_LEN:
        body = body[: MAX_MESSAGE_LEN - 20] + "\n…(truncated)"

    token = get_telegram_token()
    chat_id = get_telegram_chat_id()
    url = API_BASE.format(token=token)
    resp = requests.post(
        url,
        json={
            "chat_id": chat_id,
            "text": body,
            "disable_web_page_preview": disable_preview,
        },
        timeout=30,
    )
    resp.raise_for_status()
    data = resp.json()
    if not data.get("ok"):
        raise RuntimeError(f"Telegram API error: {data!r}")
