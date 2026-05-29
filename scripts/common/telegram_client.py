"""Send messages via Telegram Bot API."""

from __future__ import annotations

import os

import requests

from .telegram_config import get_telegram_chat_id, get_telegram_token, telegram_configured

API_ROOT = "https://api.telegram.org/bot{token}"
MAX_MESSAGE_LEN = 4096


def _parse_chat_id(raw: str) -> str | int:
    s = raw.strip()
    if s.lstrip("-").isdigit():
        return int(s)
    return s


def _api_get(token: str, method: str, **params: object) -> dict:
    url = f"{API_ROOT.format(token=token)}/{method}"
    resp = requests.get(url, params=params, timeout=30)
    try:
        data = resp.json()
    except ValueError:
        raise RuntimeError(f"Telegram {method} HTTP {resp.status_code}: {resp.text[:200]}") from None
    if not resp.ok or not data.get("ok"):
        desc = data.get("description") if isinstance(data, dict) else resp.text[:200]
        raise RuntimeError(f"Telegram {method} HTTP {resp.status_code}: {desc}")
    return data


def verify_telegram_setup() -> None:
    """getMe + getChat — fails fast with Telegram's description (no message sent)."""
    token = get_telegram_token()
    chat_id = _parse_chat_id(get_telegram_chat_id())

    me = _api_get(token, "getMe")
    username = (me.get("result") or {}).get("username") or "?"
    print(f"[telegram] bot @{username}")

    chat = _api_get(token, "getChat", chat_id=chat_id)
    result = chat.get("result") or {}
    title = result.get("title") or result.get("username") or "?"
    print(f"[telegram] chat id={chat_id} type={result.get('type')} title={title!r}")


def send_telegram_message(text: str) -> None:
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
    chat_id = _parse_chat_id(get_telegram_chat_id())
    url = f"{API_ROOT.format(token=token)}/sendMessage"
    resp = requests.post(
        url,
        json={"chat_id": chat_id, "text": body},
        timeout=30,
    )
    try:
        data = resp.json()
    except ValueError:
        data = None
    if not resp.ok:
        detail = ""
        if isinstance(data, dict):
            detail = str(data.get("description") or data)
        else:
            detail = resp.text[:200]
        raise RuntimeError(f"Telegram sendMessage HTTP {resp.status_code}: {detail}")
    if not data or not data.get("ok"):
        raise RuntimeError(f"Telegram API error: {data!r}")
