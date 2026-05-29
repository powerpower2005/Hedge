"""Send messages via Telegram Bot API."""

from __future__ import annotations

import os
import sys

import requests

from .telegram_config import CHAT_ID_ENV, get_telegram_chat_id, get_telegram_token, telegram_configured

API_ROOT = "https://api.telegram.org/bot{token}"
MAX_MESSAGE_LEN = 4096


def _parse_chat_id(raw: str) -> str | int:
    s = raw.strip()
    if s.lstrip("-").isdigit():
        return int(s)
    return s


def _migration_hint(data: dict | None) -> str:
    if not isinstance(data, dict):
        return ""
    params = data.get("parameters") or {}
    new_id = params.get("migrate_to_chat_id")
    if new_id is None:
        return ""
    return (
        f"\nUpdate GitHub secret `{CHAT_ID_ENV}` to: {new_id}\n"
        "(Group was upgraded to supergroup; old chat id no longer accepts messages.)"
    )


def _api_get(token: str, method: str, **params: object) -> dict:
    url = f"{API_ROOT.format(token=token)}/{method}"
    resp = requests.get(url, params=params, timeout=30)
    try:
        data = resp.json()
    except ValueError:
        raise RuntimeError(f"Telegram {method} HTTP {resp.status_code}: {resp.text[:200]}") from None
    if not resp.ok or not data.get("ok"):
        desc = data.get("description") if isinstance(data, dict) else resp.text[:200]
        raise RuntimeError(f"Telegram {method} HTTP {resp.status_code}: {desc}{_migration_hint(data if isinstance(data, dict) else None)}")
    return data


def verify_telegram_setup() -> None:
    """getMe + getChat; warns when stored id looks like a legacy group id."""
    token = get_telegram_token()
    chat_id = _parse_chat_id(get_telegram_chat_id())

    me = _api_get(token, "getMe")
    username = (me.get("result") or {}).get("username") or "?"
    print(f"[telegram] bot @{username}")

    chat = _api_get(token, "getChat", chat_id=chat_id)
    result = chat.get("result") or {}
    title = result.get("title") or result.get("username") or "?"
    chat_type = result.get("type")
    print(f"[telegram] chat id={chat_id} type={chat_type} title={title!r}")

    if chat_type == "group" and isinstance(chat_id, int) and chat_id < 0 and chat_id > -1000000000000:
        print(
            "[telegram] WARN: stored chat id looks like a legacy group id. "
            "If sendMessage fails with 'upgraded to a supergroup', update the secret to the new -100… id.",
            file=sys.stderr,
        )


def _send_message_once(token: str, chat_id: str | int, body: str) -> dict:
    url = f"{API_ROOT.format(token=token)}/sendMessage"
    resp = requests.post(url, json={"chat_id": chat_id, "text": body}, timeout=30)
    try:
        data = resp.json()
    except ValueError:
        data = None
    if not resp.ok or not data or not data.get("ok"):
        detail = ""
        if isinstance(data, dict):
            detail = str(data.get("description") or data)
        else:
            detail = resp.text[:200]
        params = data.get("parameters") if isinstance(data, dict) else None
        migrate_to = (params or {}).get("migrate_to_chat_id") if isinstance(params, dict) else None
        if migrate_to is not None:
            print(
                f"[telegram] chat migrated: {chat_id} -> {migrate_to}. Retrying once; "
                f"update secret `{CHAT_ID_ENV}`.",
                file=sys.stderr,
            )
            return _send_message_once(token, migrate_to, body)
        raise RuntimeError(f"Telegram sendMessage HTTP {resp.status_code}: {detail}{_migration_hint(data if isinstance(data, dict) else None)}")
    return data


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
    _send_message_once(token, chat_id, body)
