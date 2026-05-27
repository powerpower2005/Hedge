"""Format Telegram message bodies (plain text)."""

from __future__ import annotations

from typing import Any

from .telegram_highlights import ReturnMove


def _pct(rate: float | None, *, signed: bool = True) -> str:
    if rate is None:
        return "—"
    pct = float(rate) * 100.0
    if signed:
        return f"{pct:+.1f}%"
    return f"{pct:.1f}%"


def _pick_label(pick: dict[str, Any]) -> str:
    ticker = pick.get("ticker") or "?"
    name = (pick.get("instrument_name") or "").strip()
    author = pick.get("author") or "?"
    if name:
        return f"{ticker} {name} @{author}"
    return f"{ticker} @{author}"


def format_near_target_line(pick: dict[str, Any]) -> str:
    dist = (pick.get("progress") or {}).get("distance_to_target")
    cur = (pick.get("progress") or {}).get("current") or {}
    target_rr = pick.get("target", {}).get("return_rate")
    dist_pp = float(dist) * 100.0 if dist is not None else None
    dist_s = f"{dist_pp:.1f}%p" if dist_pp is not None else "—"
    return (
        f"• {_pick_label(pick)}\n"
        f"  목표 {_pct(target_rr)} · 현재 {_pct(cur.get('return_rate'))} · 남은 간격 {dist_s}"
    )


def format_big_move_line(move: ReturnMove) -> str:
    pick = move.pick
    cur = (pick.get("progress") or {}).get("current") or {}
    target_rr = pick.get("target", {}).get("return_rate")
    delta_pp = move.delta * 100.0
    return (
        f"• {_pick_label(pick)}\n"
        f"  오늘 Δ {delta_pp:+.1f}%p ({_pct(move.prior_return)} → {_pct(move.new_return)}) · "
        f"목표 {_pct(target_rr)} · 현재 {_pct(cur.get('return_rate'))}"
    )


def format_new_pick_line(pick: dict[str, Any]) -> str:
    target_rr = pick.get("target", {}).get("return_rate")
    days = pick.get("duration", {}).get("days")
    market = pick.get("market") or ""
    pid = pick.get("id")
    return (
        f"• #{pid} {_pick_label(pick)} ({market})\n"
        f"  목표 {_pct(target_rr)} · {days}일 · 진입 대기 (첫 판정 때 진입가 확정)"
    )


def format_judgment_digest(
    country: str,
    judgment_day: str,
    near: list[dict[str, Any]],
    moves: list[ReturnMove],
    *,
    near_limit: int = 5,
    move_limit: int = 3,
) -> str:
    lines = [f"[{country} 일일 하이라이트] {judgment_day}", ""]
    lines.append(f"🎯 목표 임박 (상위 {near_limit})")
    if near:
        lines.extend(format_near_target_line(p) for p in near)
    else:
        lines.append("• (해당 없음)")
    lines.append("")
    lines.append(f"📈 큰 움직임 (|Δ| 상위 {move_limit})")
    if moves:
        lines.extend(format_big_move_line(m) for m in moves)
    else:
        lines.append("• (오늘 판정에서 비교할 전일 수익률 없음)")
    return "\n".join(lines)


def format_new_pick_message(pick: dict[str, Any]) -> str:
    country = pick.get("country") or "?"
    created = (pick.get("created_at") or "")[:10]
    header = f"[신규 등록 {country}] {created or 'today'}"
    return f"{header}\n\n🆕 새 픽\n{format_new_pick_line(pick)}"
