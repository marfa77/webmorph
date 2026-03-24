"""
Отправка outreach из leads.db с дневным лимитом (рампинг) и учётом в outreach_sent.

Лимит по умолчанию: 20 писем/день первые 14 дней с даты старта кампании,
затем +10 к дневному лимиту каждую календарную неделю (день 14–20 → 30, 21–27 → 40, …).

Требуется: campaign start date, SMTP в .env (см. --help).
"""

from __future__ import annotations

import argparse
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
from urllib.parse import urlparse
from zoneinfo import ZoneInfo

try:
    from dotenv import load_dotenv
except ImportError:
    load_dotenv = None  # type: ignore[misc, assignment]

from export_outreach_md import EMAIL_TEMPLATE, _blocked, subject_problem
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


def fetch_queue(conn: sqlite3.Connection, limit: int) -> list[dict[str, Any]]:
    cur = conn.execute(
        """
        SELECT l.id, l.url, l.host, l.email, l.score, l.reasons, l.niche
        FROM leads l
        WHERE l.email IS NOT NULL AND l.email != ''
          AND NOT EXISTS (SELECT 1 FROM outreach_sent s WHERE lower(s.email) = lower(l.email))
        ORDER BY l.score DESC, l.id DESC
        """
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
    sent_today = sent_on_local_day(conn, tz, today_iso)
    remaining = cap - sent_today
    if remaining <= 0:
        print(f"Лимит на сегодня исчерпан ({sent_today}/{cap}).")
        return

    from_email = os.environ.get("SMTP_FROM", os.environ.get("SMTP_USER", "")).strip()
    from_name = os.environ.get("SMTP_FROM_NAME", "").strip() or None

    queue = fetch_queue(conn, limit=remaining)
    if not queue:
        print("Очередь пуста: не осталось лидов без записи в outreach_sent.")
        return

    print(
        f"День кампании {idx}, лимит {cap}/день, сегодня уже {sent_today}, отправляем до {remaining} писем, в очереди {len(queue)}."
    )

    if dry_run:
        for r in queue:
            host = _host_from_row(r)
            em = (r.get("email") or "").strip()
            print(f"DRY  {em}  |  {subject_problem(host)[:60]}…")
        return

    if not from_email:
        print("Задайте SMTP_FROM или SMTP_USER.", file=sys.stderr)
        sys.exit(1)

    sent = 0
    for r in queue:
        host = _host_from_row(r)
        em = (r.get("email") or "").strip()
        lead_id = r.get("id")
        subj = subject_problem(host)
        body = EMAIL_TEMPLATE.format(host=host)
        try:
            send_smtp(
                to_addr=em,
                subject=subj,
                body=body,
                from_email=from_email,
                from_name=from_name,
            )
            conn.execute(
                """
                INSERT INTO outreach_sent (email, lead_id, sent_at, subject, source)
                VALUES (?, ?, ?, ?, 'smtp')
                """,
                (em.lower(), lead_id, utc_now_iso(), subj),
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

Переменные окружения (pipeline/.env):
  OUTREACH_START_DATE   дата первого дня кампании (обязательно для send/status)
  OUTREACH_TZ             часовой пояс для «сегодня» (по умолчанию UTC)
  SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD
  SMTP_FROM, SMTP_FROM_NAME   от кого (часто = SMTP_USER)
  SMTP_SSL=1 или SMTP_STARTTLS=1 (порт 587)

Пример:  OUTREACH_START_DATE=2025-03-20  python send_outreach.py send --dry-run
"""
        )
        sys.exit(0)

    ap = argparse.ArgumentParser(description="Рассылка outreach с лимитом и SMTP")
    ap.add_argument("--db", default=str(DEFAULT_DB_PATH), help="Путь к leads.db")
    sub = ap.add_subparsers(dest="cmd", required=True)

    p_send = sub.add_parser("send", help="Отправить до дневного лимита (по умолчанию)")
    p_send.add_argument("--dry-run", action="store_true", help="Только показать, куда ушло бы")
    p_send.add_argument("--no-delay", action="store_true", help="Без паузы между письмами")
    p_send.add_argument("--min-delay", type=float, default=45.0, help="Сек между письмами (мин)")
    p_send.add_argument("--max-delay", type=float, default=120.0, help="Сек между письмами (макс)")

    p_mark = sub.add_parser("mark-sent", help="Отметить адреса как уже отправленные (ручная рассылка)")
    p_mark.add_argument("--emails", default="", help="Список через запятую")
    p_mark.add_argument("--file", type=Path, help="Файл: один email на строку")

    p_start = sub.add_parser("set-start-date", help="Сохранить дату старта кампании в БД")
    p_start.add_argument("date", help="YYYY-MM-DD")

    p_status = sub.add_parser("status", help="Лимит и сколько отправлено сегодня")

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
        if args.cmd == "send":
            run_send(
                conn,
                tz,
                dry_run=args.dry_run,
                min_delay=args.min_delay,
                max_delay=args.max_delay,
                no_delay=args.no_delay,
            )
            return
    finally:
        conn.close()


if __name__ == "__main__":
    main()
