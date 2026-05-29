"""Telegram Bot API credentials from environment (GitHub Actions secrets)."""

from __future__ import annotations

import os

TOKEN_ENV = "TELEGRAM_BOT_TOKEN_HEALTHY_FIRE_BOT"
CHAT_ID_ENV = "TELEGRAM_CHAT_ID_HEALTHY_GAEMI"

def telegram_configured() -> bool:
    token = os.environ.get(TOKEN_ENV, "").strip()
    chat_id = os.environ.get(CHAT_ID_ENV, "").strip()
    return bool(token and chat_id)


def get_telegram_token() -> str:
    token = os.environ.get(TOKEN_ENV, "").strip()
    if not token:
        raise RuntimeError(f"Missing {TOKEN_ENV}")
    return token


def get_telegram_chat_id() -> str:
    chat_id = os.environ.get(CHAT_ID_ENV, "").strip()
    if not chat_id:
        raise RuntimeError(f"Missing {CHAT_ID_ENV}")
    return chat_id
