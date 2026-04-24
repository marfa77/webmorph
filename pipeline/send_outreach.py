"""
Отправка outreach из leads.db с дневным лимитом (рампинг) и учётом в outreach_sent.

Лимит по умолчанию: 20 писем/день первые 14 дней с даты старта кампании,
затем +10 к дневному лимиту каждую календарную неделю (день 14–20 → 30, 21–27 → 40, …).

Требуется: campaign start date и либо SMTP, либо Microsoft Graph (см. --help).
"""

from __future__ import annotations

import argparse
import json
import os
import random
import re
import smtplib
import sqlite3
import sys
import time
from datetime import date, datetime, timezone
from email.message import EmailMessage
from email.utils import formataddr
from pathlib import Path
from typing import Any
from urllib.parse import quote, unquote, urlparse
from zoneinfo import ZoneInfo

import requests

try:
    from dotenv import load_dotenv
except ImportError:
    load_dotenv = None  # type: ignore[misc, assignment]

from export_outreach_md import _blocked, build_email_body, subject_problem
from leads_db import DEFAULT_DB_PATH, connect, init_db

# Доменная логика очереди как в export_outreach_md (тот же порядок и фильтр)
def _host_from_row(r: dict[str, Any]) -> str:
    h = r.get("host") or ""
    if h:
        return h
    u = r.get("url") or ""
    try:
        return urlparse(u).netloc.lower().lstrip("www.") or ""
    except Exception:
        return ""


def daily_send_cap(day_index: int) -> int:
    """
    day_index: номер дня относительно старта кампании (0 = первый день).
    Дни 0–13: 20/день. Со дня 14: +10 к лимиту за каждую полную неделю после первых двух.
    """
    if day_index < 0:
        return 0
    if day_index < 14:
        return 20
    extra_weeks = (day_index - 14) // 7
    return 20 + 10 * (1 + extra_weeks)


def _parse_iso_date(s: str) -> date:
    s = s.strip()
    return date.fromisoformat(s[:10])


def campaign_day_index(start: date, today: date) -> int:
    return (today - start).days


def get_meta(conn: sqlite3.Connection, key: str) -> str | None:
    cur = conn.execute("SELECT value FROM outreach_meta WHERE key = ?", (key,))
    row = cur.fetchone()
    return row[0] if row else None


def set_meta(conn: sqlite3.Connection, key: str, value: str) -> None:
    conn.execute(
        "INSERT INTO outreach_meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        (key, value),
    )


def resolve_start_date(conn: sqlite3.Connection) -> date | None:
    raw = os.environ.get("OUTREACH_START_DATE", "").strip()
    if raw:
        return _parse_iso_date(raw)
    s = get_meta(conn, "campaign_start_date")
    if s:
        return _parse_iso_date(s)
    return None


def resolve_tz() -> ZoneInfo:
    name = os.environ.get("OUTREACH_TZ", "").strip() or "UTC"
    try:
        return ZoneInfo(name)
    except Exception:
        return ZoneInfo("UTC")


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def sent_on_local_day(conn: sqlite3.Connection, tz: ZoneInfo, day_iso: str) -> int:
    """Сколько писем с датой sent_at, попадающей в локальный календарный день day_iso (YYYY-MM-DD)."""
    cur = conn.execute("SELECT sent_at FROM outreach_sent")
    n = 0
    for (sent_at,) in cur.fetchall():
        try:
            raw = (sent_at or "").strip()
            if raw.endswith("Z"):
                raw = raw[:-1] + "+00:00"
            dt = datetime.fromisoformat(raw)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            local_d = dt.astimezone(tz).date().isoformat()
            if local_d == day_iso:
                n += 1
        except Exception:
            continue
    return n


def _valid_outreach_email(addr: str) -> bool:
    """Отсекаем ложные совпадения из HTML (картинки, CSS) и плейсхолдеры."""
    e = (addr or "").strip()
    if e.count("@") != 1:
        return False
    local, _, domain = e.partition("@")
    local = unquote(local).strip()
    if not local or not domain or "." not in domain:
        return False
    low_loc = local.lower()
    if "u003e" in low_loc or low_loc.startswith(">"):
        return False
    if any(c in local for c in " \t\n"):
        return False
    e_norm = f"{local}@{domain}"
    if len(e_norm) > 254 or len(local) > 64:
        return False
    if any(c in local for c in "/\\"):
        return False
    low = local.lower()
    if any(
        low.endswith(s)
        for s in (".png", ".jpg", ".jpeg", ".gif", ".css", ".js", ".svg", ".webp")
    ):
        return False
    dom_low = domain.lower()
    if dom_low in ("example.com", "domain.com", "test.com", "localhost"):
        return False
    if low_loc == "your" and dom_low == "email.com":
        return False
    if low_loc == "john" and dom_low == "doe.com":
        return False
    if any(
        dom_low.endswith(s)
        for s in (".png", ".jpg", ".jpeg", ".gif", ".css", ".js", ".svg", ".webp")
    ):
        return False
    if low in ("user", "test", "admin", "noreply") and "domain" in domain.lower():
        return False
    if not re.match(
        r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$", e_norm
    ):
        return False
    return True


def _pixid_skip_gov_corp_email(email: str) -> bool:
    """Не слать B2B-аутрич на госсектор и типовые корпоративные ящики."""
    dom = email.split("@")[-1].lower() if "@" in email else ""
    if not dom:
        return True
    if ".gov" in dom or dom.endswith(".mil") or dom.endswith(".gouv.fr"):
        return True
    for s in (
        "walmart.com",
        "amazon.",
        "swindlerbuster",
        "incometax.gov",
    ):
        if s in dom:
            return True
    return False


def _normalize_lead_email(addr: str) -> str | None:
    """Вернуть нормализованный адрес или None, если невалиден."""
    if not _valid_outreach_email(addr):
        return None
    local, _, domain = (addr or "").strip().partition("@")
    local = unquote(local).strip()
    return f"{local}@{domain}"


def fetch_queue_pixid(conn: sqlite3.Connection, limit: int) -> list[dict[str, Any]]:
    """Очередь для PixID (фотоателье): те же правила, что в export_pixid_photo_studios_md."""
    from clean_pixid_photo_leads import _reject_reason, pixid_junk_email_domain
    from export_pixid_photo_studios_md import _row_ok_for_pixid

    where = """
        l.email IS NOT NULL AND l.email != ''
          AND NOT EXISTS (SELECT 1 FROM outreach_sent s WHERE lower(s.email) = lower(l.email))
    """
    cur = conn.execute(
        f"""
        SELECT l.id, l.url, l.host, l.email, l.score, l.reasons, l.niche, l.psi_mobile_score
        FROM leads l
        WHERE {where}
        ORDER BY l.id DESC
        LIMIT ?
        """,
        (max(limit * 80, 400),),
    )
    rows = [dict(zip([c[0] for c in cur.description], row)) for row in cur.fetchall()]
    out: list[dict[str, Any]] = []
    seen_emails: set[str] = set()
    for r in rows:
        if not _row_ok_for_pixid(r):
            continue
        url = r.get("url") or ""
        hrow = (r.get("host") or "").strip()
        if not hrow:
            hrow = _host_from_row(r)
        if _reject_reason(url, hrow):
            continue
        em_raw = (r.get("email") or "").strip()
        em_norm = _normalize_lead_email(em_raw)
        if not em_norm:
            continue
        if pixid_junk_email_domain(em_norm):
            continue
        if _pixid_skip_gov_corp_email(em_norm):
            continue
        el = em_norm.lower()
        if el in seen_emails:
            continue
        seen_emails.add(el)
        host = _host_from_row(r)
        if _blocked(host):
            continue
        out.append({**dict(r), "email": em_norm})
        if len(out) >= limit:
            break
    return out


def _pixid_subject_and_body(r: dict[str, Any]) -> tuple[str, str]:
    from export_pixid_photo_studios_md import BODY_TEMPLATE, SUBJECT, first_name_from_email

    em = (r.get("email") or "").strip()
    body = BODY_TEMPLATE.format(first_name=first_name_from_email(em))
    return SUBJECT, body


def fetch_queue(
    conn: sqlite3.Connection,
    limit: int,
    *,
    psi_slow_only: bool = False,
    psi_threshold: int = 55,
) -> list[dict[str, Any]]:
    where = """
        l.email IS NOT NULL AND l.email != ''
          AND NOT EXISTS (SELECT 1 FROM outreach_sent s WHERE lower(s.email) = lower(l.email))
    """
    params: list[Any] = []
    if psi_slow_only:
        where += " AND l.psi_mobile_score IS NOT NULL AND l.psi_mobile_score < ?"
        params.append(int(psi_threshold))
    cur = conn.execute(
        f"""
        SELECT l.id, l.url, l.host, l.email, l.score, l.reasons, l.niche, l.psi_mobile_score
        FROM leads l
        WHERE {where}
        ORDER BY l.score DESC, l.id DESC
        """,
        params,
    )
    rows = [dict(zip([c[0] for c in cur.description], row)) for row in cur.fetchall()]
    out: list[dict[str, Any]] = []
    for r in rows:
        host = _host_from_row(r)
        if _blocked(host):
            continue
        out.append(r)
        if len(out) >= limit:
            break
    return out


def load_env() -> None:
    if load_dotenv:
        env_path = Path(__file__).resolve().parent / ".env"
        load_dotenv(env_path)


def use_graph_backend() -> bool:
    b = os.environ.get("OUTREACH_SEND_BACKEND", "").strip().lower()
    if b in ("graph", "msgraph", "microsoft-graph"):
        return True
    return bool(
        os.environ.get("GRAPH_TENANT_ID", "").strip()
        and os.environ.get("GRAPH_CLIENT_ID", "").strip()
        and os.environ.get("GRAPH_CLIENT_SECRET", "").strip()
    )


def graph_get_access_token() -> str:
    tenant = os.environ.get("GRAPH_TENANT_ID", "").strip()
    cid = os.environ.get("GRAPH_CLIENT_ID", "").strip()
    sec = os.environ.get("GRAPH_CLIENT_SECRET", "").strip()
    if not tenant or not cid or not sec:
        print(
            "Graph: задайте GRAPH_TENANT_ID, GRAPH_CLIENT_ID, GRAPH_CLIENT_SECRET в pipeline/.env",
            file=sys.stderr,
        )
        sys.exit(1)
    url = f"https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token"
    r = requests.post(
        url,
        data={
            "client_id": cid,
            "client_secret": sec,
            "scope": "https://graph.microsoft.com/.default",
            "grant_type": "client_credentials",
        },
        timeout=60,
    )
    if r.status_code != 200:
        print(f"Graph token error {r.status_code}: {r.text[:500]}", file=sys.stderr)
        sys.exit(1)
    return str(r.json()["access_token"])


def send_graph(
    *,
    to_addr: str,
    subject: str,
    body: str,
    from_upn: str,
) -> None:
    """Отправка через Graph API (application permission Mail.Send). Отправитель = ящик from_upn."""
    token = graph_get_access_token()
    user_seg = quote(from_upn, safe="")
    url = f"https://graph.microsoft.com/v1.0/users/{user_seg}/sendMail"
    msg: dict[str, Any] = {
        "subject": subject,
        "body": {"contentType": "Text", "content": body},
        "toRecipients": [{"emailAddress": {"address": to_addr}}],
    }
    payload = {"message": msg, "saveToSentItems": True}
    r = requests.post(
        url,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
        data=json.dumps(payload),
        timeout=90,
    )
    if r.status_code not in (200, 202):
        print(f"Graph sendMail {r.status_code}: {r.text[:800]}", file=sys.stderr)
        sys.exit(1)


def send_smtp(
    *,
    to_addr: str,
    subject: str,
    body: str,
    from_email: str,
    from_name: str | None,
) -> None:
    host = os.environ.get("SMTP_HOST", "").strip()
    user = os.environ.get("SMTP_USER", "").strip()
    password = os.environ.get("SMTP_PASSWORD", "").strip()
    port = int(os.environ.get("SMTP_PORT", "587"))
    use_starttls = os.environ.get("SMTP_STARTTLS", "1").strip() in ("1", "true", "yes")
    use_ssl = os.environ.get("SMTP_SSL", "0").strip() in ("1", "true", "yes")

    if not host or not user or not password:
        print(
            "Задайте SMTP_HOST, SMTP_USER, SMTP_PASSWORD (и при необходимости SMTP_PORT, SMTP_STARTTLS, SMTP_SSL).",
            file=sys.stderr,
        )
        sys.exit(1)

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["To"] = to_addr
    if from_name:
        msg["From"] = formataddr((from_name, from_email))
    else:
        msg["From"] = from_email
    msg.set_content(body)

    if use_ssl:
        with smtplib.SMTP_SSL(host, port, timeout=60) as smtp:
            smtp.login(user, password)
            smtp.send_message(msg)
    else:
        with smtplib.SMTP(host, port, timeout=60) as smtp:
            if use_starttls:
                smtp.starttls()
            smtp.login(user, password)
            smtp.send_message(msg)


def cmd_set_start_date(conn: sqlite3.Connection, d: date) -> None:
    set_meta(conn, "campaign_start_date", d.isoformat())
    conn.commit()
    print(f"OK: campaign_start_date = {d.isoformat()} (в outreach_meta)")


def cmd_mark_sent(
    conn: sqlite3.Connection,
    emails: list[str],
    source: str = "manual",
) -> None:
    now = utc_now_iso()
    n = 0
    for raw in emails:
        em = raw.strip().lower()
        if not em or "@" not in em:
            continue
        cur = conn.execute("SELECT id FROM leads WHERE lower(email) = ?", (em,))
        row = cur.fetchone()
        lead_id = int(row[0]) if row else None
        try:
            conn.execute(
                """
                INSERT INTO outreach_sent (email, lead_id, sent_at, subject, source)
                VALUES (?, ?, ?, ?, ?)
                """,
                (em, lead_id, now, None, source),
            )
            n += 1
        except sqlite3.IntegrityError:
            pass
    conn.commit()
    print(f"OK: отмечено как отправленные: {n} адресов (остальные уже были в outreach_sent)")


_EMAIL_SPLIT = re.compile(r"[\s,;]+")


def parse_email_list(s: str) -> list[str]:
    return [x for x in (_EMAIL_SPLIT.split(s.strip()) if s else []) if x]


def cmd_status(
    conn: sqlite3.Connection,
    tz: ZoneInfo,
) -> None:
    start = resolve_start_date(conn)
    today = datetime.now(tz).date()
    today_iso = today.isoformat()
    if not start:
        print("Старт кампании не задан: OUTREACH_START_DATE или send_outreach.py set-start-date")
        return
    idx = campaign_day_index(start, today)
    cap = daily_send_cap(idx)
    sent_today = sent_on_local_day(conn, tz, today_iso)
    cur = conn.execute("SELECT COUNT(*) FROM outreach_sent")
    total_sent = int(cur.fetchone()[0])
    tz_label = getattr(tz, "key", None) or str(tz)
    print(f"Старт кампании: {start.isoformat()}  |  сегодня ({tz_label}): {today_iso}")
    print(f"День кампании (0-based): {idx}  |  лимит сегодня: {cap}  |  уже отправлено сегодня: {sent_today}  |  остаток: {max(0, cap - sent_today)}")
    print(f"Всего отмечено отправленным: {total_sent}")


def run_send(
    conn: sqlite3.Connection,
    tz: ZoneInfo,
    *,
    dry_run: bool,
    min_delay: float,
    max_delay: float,
    no_delay: bool,
    psi_slow_only: bool = False,
    psi_threshold: int = 55,
    pixid_photo_studios: bool = False,
    min_daily_cap: int | None = None,
) -> None:
    start = resolve_start_date(conn)
    if not start:
        print(
            "Укажите дату старта: переменная OUTREACH_START_DATE=YYYY-MM-DD в pipeline/.env "
            "или команда: python send_outreach.py set-start-date YYYY-MM-DD",
            file=sys.stderr,
        )
        sys.exit(1)

    today = datetime.now(tz).date()
    today_iso = today.isoformat()
    idx = campaign_day_index(start, today)
    cap = daily_send_cap(idx)
    if min_daily_cap is not None and min_daily_cap > 0:
        cap = max(cap, int(min_daily_cap))
    sent_today = sent_on_local_day(conn, tz, today_iso)
    remaining = cap - sent_today
    if remaining <= 0:
        print(f"Лимит на сегодня исчерпан ({sent_today}/{cap}).")
        return

    if pixid_photo_studios:
        queue = fetch_queue_pixid(conn, limit=remaining)
    else:
        queue = fetch_queue(
            conn,
            limit=remaining,
            psi_slow_only=psi_slow_only,
            psi_threshold=psi_threshold,
        )
    if not queue:
        print("Очередь пуста: не осталось лидов без записи в outreach_sent.")
        return

    graph_mode = use_graph_backend()
    backend_label = "Graph" if graph_mode else "SMTP"
    mode_lbl = "PixID photo studios" if pixid_photo_studios else "webmorp"

    print(
        f"День кампании {idx}, лимит {cap}/день, сегодня уже {sent_today}, отправляем до {remaining} писем, в очереди {len(queue)}. Канал: {backend_label}. Режим: {mode_lbl}."
    )

    if graph_mode:
        from_email = (
            os.environ.get("GRAPH_FROM_USER", "").strip()
            or os.environ.get("SMTP_FROM", "").strip()
            or os.environ.get("SMTP_USER", "").strip()
        )
        from_name = None
    else:
        from_email = os.environ.get("SMTP_FROM", os.environ.get("SMTP_USER", "")).strip()
        from_name = os.environ.get("SMTP_FROM_NAME", "").strip() or None

    if dry_run:
        for r in queue:
            em = (r.get("email") or "").strip()
            if pixid_photo_studios:
                subj, _ = _pixid_subject_and_body(r)
            else:
                host = _host_from_row(r)
                psi = r.get("psi_mobile_score")
                ps = int(psi) if psi is not None else None
                subj = subject_problem(host, psi_mobile=ps)
            print(f"DRY  {em}  |  {subj[:72]}{'…' if len(subj) > 72 else ''}")
        return

    if not from_email:
        print(
            "Задайте отправителя: для Graph — GRAPH_FROM_USER (или SMTP_FROM/SMTP_USER); для SMTP — SMTP_FROM или SMTP_USER.",
            file=sys.stderr,
        )
        sys.exit(1)

    sent = 0
    for r in queue:
        em = (r.get("email") or "").strip()
        lead_id = r.get("id")
        if pixid_photo_studios:
            subj, body = _pixid_subject_and_body(r)
        else:
            host = _host_from_row(r)
            psi = r.get("psi_mobile_score")
            ps = int(psi) if psi is not None else None
            subj = subject_problem(host, psi_mobile=ps)
            body = build_email_body(host, em, ps)
        try:
            if graph_mode:
                send_graph(to_addr=em, subject=subj, body=body, from_upn=from_email)
                src = "graph"
            else:
                send_smtp(
                    to_addr=em,
                    subject=subj,
                    body=body,
                    from_email=from_email,
                    from_name=from_name,
                )
                src = "smtp"
            src_tag = f"{src}_pixid" if pixid_photo_studios else src
            conn.execute(
                """
                INSERT INTO outreach_sent (email, lead_id, sent_at, subject, source)
                VALUES (?, ?, ?, ?, ?)
                """,
                (em.lower(), lead_id, utc_now_iso(), subj, src_tag),
            )
            conn.commit()
            sent += 1
            print(f"OK {sent}/{len(queue)} → {em}")
        except Exception as e:
            print(f"FAIL → {em}: {e}", file=sys.stderr)
            sys.exit(1)

        if sent < len(queue) and not no_delay:
            time.sleep(random.uniform(min_delay, max_delay))

    print(f"Готово: отправлено {sent} писем.")


def main() -> None:
    load_env()
    if len(sys.argv) == 1:
        sys.argv.append("send")
    if len(sys.argv) == 2 and sys.argv[1] in ("-h", "--help"):
        print(
            """usage: send_outreach.py [--db PATH] <command> ...

Рассылка из leads.db с лимитом: 20/день первые 14 дней от OUTREACH_START_DATE,
затем +10 к дневному лимиту каждую неделю (день 14–20 → 30, 21–27 → 40, …).

Команды:
  send [--dry-run] [--no-delay]   отправить до остатка дневного лимита
  status                             лимит сегодня и сколько уже отправлено
  mark-sent --emails A,B | --file   отметить уже отправленные (вручную)
  set-start-date YYYY-MM-DD         дата старта кампании в БД
  test-graph                         проверить токен Graph (GRAPH_* в .env)

Переменные окружения (pipeline/.env):
  OUTREACH_START_DATE   дата первого дня кампании (обязательно для send/status)
  OUTREACH_TZ             часовой пояс для «сегодня» (по умолчанию UTC)

  SMTP (классическая отправка):
  SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM, SMTP_FROM_NAME …

  Microsoft Graph (если SMTP заблокирован Security defaults / политиками):
  GRAPH_TENANT_ID, GRAPH_CLIENT_ID, GRAPH_CLIENT_SECRET
  GRAPH_FROM_USER=customer@...   ящик отправителя (Application permission Mail.Send + admin consent)
  OUTREACH_SEND_BACKEND=graph   или явно задать все три GRAPH_* — тогда выбирается Graph

Пример:  OUTREACH_START_DATE=2025-03-20  python send_outreach.py send --dry-run
"""
        )
        sys.exit(0)

    ap = argparse.ArgumentParser(description="Рассылка outreach с лимитом (SMTP или Microsoft Graph)")
    ap.add_argument("--db", default=str(DEFAULT_DB_PATH), help="Путь к leads.db")
    sub = ap.add_subparsers(dest="cmd", required=True)

    p_send = sub.add_parser("send", help="Отправить до дневного лимита (по умолчанию)")
    p_send.add_argument("--dry-run", action="store_true", help="Только показать, куда ушло бы")
    p_send.add_argument("--no-delay", action="store_true", help="Без паузы между письмами")
    p_send.add_argument("--min-delay", type=float, default=45.0, help="Сек между письмами (мин)")
    p_send.add_argument("--max-delay", type=float, default=120.0, help="Сек между письмами (макс)")
    p_send.add_argument(
        "--psi-slow-only",
        action="store_true",
        help="Только лиды с PSI mobile < порога (см. OUTREACH_PSI_SLOW_ONLY=1 в .env)",
    )
    p_send.add_argument(
        "--psi-threshold",
        type=int,
        default=55,
        help="Порог для --psi-slow-only (по умолчанию 55)",
    )
    p_send.add_argument(
        "--pixid-photo-studios",
        action="store_true",
        help="PixID: тема/тело (в т.ч. 5 trial exports, ответом — ключ); очередь из --db; запись в outreach_sent, source=*_pixid",
    )
    p_send.add_argument(
        "--min-daily-cap",
        type=int,
        default=None,
        metavar="N",
        help="Поднять дневной лимит хотя бы до N (например 30, если штатный лимит 20). Осторожно с репутацией домена.",
    )

    p_mark = sub.add_parser("mark-sent", help="Отметить адреса как уже отправленные (ручная рассылка)")
    p_mark.add_argument("--emails", default="", help="Список через запятую")
    p_mark.add_argument("--file", type=Path, help="Файл: один email на строку")

    p_start = sub.add_parser("set-start-date", help="Сохранить дату старта кампании в БД")
    p_start.add_argument("date", help="YYYY-MM-DD")

    p_status = sub.add_parser("status", help="Лимит и сколько отправлено сегодня")

    sub.add_parser("test-graph", help="Проверить client credentials и токен Graph")

    args = ap.parse_args()
    db_path = Path(args.db)
    init_db(db_path)
    conn = connect(db_path)
    tz = resolve_tz()

    try:
        if args.cmd == "set-start-date":
            cmd_set_start_date(conn, _parse_iso_date(args.date))
            return
        if args.cmd == "mark-sent":
            emails: list[str] = []
            emails.extend(parse_email_list(args.emails))
            if args.file:
                emails.extend(
                    [
                        line.strip()
                        for line in args.file.read_text(encoding="utf-8").splitlines()
                        if line.strip()
                    ]
                )
            if not emails:
                print("Укажите --emails или --file", file=sys.stderr)
                sys.exit(1)
            cmd_mark_sent(conn, emails)
            return
        if args.cmd == "status":
            cmd_status(conn, tz)
            return
        if args.cmd == "test-graph":
            tok = graph_get_access_token()
            print(f"Graph: токен получен, OK (длина {len(tok)}). Проверь в Azure: Mail.Send (application) + admin consent.")
            return
        if args.cmd == "send":
            env_psi = os.environ.get("OUTREACH_PSI_SLOW_ONLY", "").strip().lower() in (
                "1",
                "true",
                "yes",
            )
            run_send(
                conn,
                tz,
                dry_run=args.dry_run,
                min_delay=args.min_delay,
                max_delay=args.max_delay,
                no_delay=args.no_delay,
                psi_slow_only=bool(args.psi_slow_only or env_psi),
                psi_threshold=int(args.psi_threshold),
                pixid_photo_studios=bool(args.pixid_photo_studios),
                min_daily_cap=args.min_daily_cap,
            )
            return
    finally:
        conn.close()


if __name__ == "__main__":
    main()
