"""
Перепроверка уже сохранённых лидов в leads.db текущей логикой finder:
- _looks_like_non_static_brochure (CMS / магазины / SPA и т.д.) → удаление
- _score_page + min_score → удаление при низком балле
Опционально: --strict-email — нет email на домене сайта после пересканирования → удаление.
--skip-engine-filter — не удалять по CMS/магазин/SPA (_looks_like_non_static_brochure); только
пересчёт score и отсев по --min-score. Нужен, если почти весь список на WordPress и «жёсткий»
рефильтр сносит всех.

Пример:
  python refilter_leads.py --dry-run
  python refilter_leads.py --min-score 5 --delay 0.35
  python refilter_leads.py --since 2026-03-23 --skip-engine-filter   # оставить WP, убрать только слабый score
"""

from __future__ import annotations

import argparse
import sqlite3
import sys
import time
from pathlib import Path

from bs4 import BeautifulSoup

from finder import (
    _email_matches_site,
    _emails_from_html,
    _fetch,
    _find_contact_url,
    _looks_like_non_static_brochure,
    _pick_email_for_site,
    _score_page,
)
from leads_db import DEFAULT_DB_PATH, init_db, _utc_now


def _gather_emails(url: str, html: str, meta: dict, delay: float) -> list[str]:
    soup = BeautifulSoup(html, "html.parser")
    base = meta.get("final_url") or url
    emails = list(_emails_from_html(html))
    extra = _find_contact_url(soup, base)
    if extra and extra.rstrip("/") != url.rstrip("/"):
        time.sleep(delay)
        h2, _ = _fetch(extra)
        if h2:
            emails.extend(_emails_from_html(h2))
    return list(dict.fromkeys(emails))[:5]


def _null_outreach_for_lead(conn: sqlite3.Connection, lead_id: int) -> None:
    conn.execute("UPDATE outreach_sent SET lead_id = NULL WHERE lead_id = ?", (lead_id,))


def main() -> None:
    ap = argparse.ArgumentParser(
        description="Перепрогнать leads.db через актуальный фильтр finder (без DDG)",
    )
    ap.add_argument("--db", type=Path, default=DEFAULT_DB_PATH, help="Путь к leads.db")
    ap.add_argument("--min-score", type=int, default=5, help="Мин. score 1–10 (как у collect_leads)")
    ap.add_argument("--delay", type=float, default=0.35, help="Пауза между запросами к сайтам (сек)")
    ap.add_argument(
        "--since",
        metavar="YYYY-MM-DD",
        help="Только лиды с created_at >= этой даты (UTC, по префиксу строки)",
    )
    ap.add_argument(
        "--strict-email",
        action="store_true",
        help="Удалить, если после пересканирования нет email на домене сайта",
    )
    ap.add_argument(
        "--drop-unreachable",
        action="store_true",
        help="Удалить строку, если главная не открывается (по умолчанию — только предупреждение, строка остаётся)",
    )
    ap.add_argument("--limit", type=int, default=0, help="Обработать не больше N строк (0 = все)")
    ap.add_argument("--dry-run", action="store_true", help="Только отчёт, без DELETE/UPDATE")
    ap.add_argument(
        "--skip-engine-filter",
        action="store_true",
        help="Не удалять по признакам CMS/конструктора/магазина/SPA (большинство SMB на WP — иначе список пустеет)",
    )
    args = ap.parse_args()

    db_path = args.db.resolve()
    if not db_path.is_file():
        print(f"Нет файла базы: {db_path}", file=sys.stderr)
        sys.exit(1)

    init_db(db_path)
    conn = sqlite3.connect(str(db_path))
    conn.row_factory = sqlite3.Row
    try:
        q = "SELECT id, url, email, niche FROM leads ORDER BY id ASC"
        params: tuple = ()
        if args.since:
            q = (
                "SELECT id, url, email, niche FROM leads WHERE created_at >= ? "
                "ORDER BY id ASC"
            )
            params = (f"{args.since}T00:00:00",)
        cur = conn.execute(q, params)
        rows = cur.fetchall()
    finally:
        pass

    if args.limit and args.limit > 0:
        rows = rows[: args.limit]

    n_total = len(rows)
    n_delete_filter = n_delete_score = n_delete_email = n_delete_unreachable = 0
    n_update = n_skip_unreachable = 0

    if args.skip_engine_filter:
        print(
            "Режим --skip-engine-filter: CMS/магазины/SPA не отсекаем, только score и --min-score.",
            file=sys.stderr,
        )

    for i, row in enumerate(rows, 1):
        lid = int(row["id"])
        url = row["url"]
        print(f"[{i}/{n_total}] {url}", file=sys.stderr, flush=True)

        time.sleep(args.delay)
        html, meta = _fetch(url)

        if not html:
            if args.drop_unreachable:
                n_delete_unreachable += 1
                if not args.dry_run:
                    _null_outreach_for_lead(conn, lid)
                    conn.execute("DELETE FROM leads WHERE id = ?", (lid,))
                    conn.commit()
                print("  → удалить: unreachable", file=sys.stderr)
            else:
                n_skip_unreachable += 1
                print("  → пропуск: unreachable (без удаления)", file=sys.stderr)
            continue

        if not args.skip_engine_filter and _looks_like_non_static_brochure(html):
            n_delete_filter += 1
            if not args.dry_run:
                _null_outreach_for_lead(conn, lid)
                conn.execute("DELETE FROM leads WHERE id = ?", (lid,))
                conn.commit()
            print("  → удалить: non-static / CMS / shop / SPA markers", file=sys.stderr)
            continue

        score, reasons = _score_page(html, meta)
        reasons_s = "; ".join(reasons) if reasons else "ok"

        if score < args.min_score:
            n_delete_score += 1
            if not args.dry_run:
                _null_outreach_for_lead(conn, lid)
                conn.execute("DELETE FROM leads WHERE id = ?", (lid,))
                conn.commit()
            print(f"  → удалить: score {score} < {args.min_score}", file=sys.stderr)
            continue

        if args.strict_email:
            emails = _gather_emails(url, html, meta, min(args.delay, 0.5))
            contact = _pick_email_for_site(url, emails) if emails else ""
            if not contact or "@" not in contact or not _email_matches_site(url, contact):
                n_delete_email += 1
                if not args.dry_run:
                    _null_outreach_for_lead(conn, lid)
                    conn.execute("DELETE FROM leads WHERE id = ?", (lid,))
                    conn.commit()
                print("  → удалить: strict-email (нет email на домене)", file=sys.stderr)
                continue

        n_update += 1
        if not args.dry_run:
            conn.execute(
                """
                UPDATE leads SET score = ?, reasons = ?, updated_at = ?
                WHERE id = ?
                """,
                (score, reasons_s, _utc_now(), lid),
            )
            conn.commit()
        print(f"  → ok: score={score}", file=sys.stderr)

    print(
        "\nИтого: "
        f"всего {n_total}, "
        f"удалено фильтр={n_delete_filter}, score={n_delete_score}, "
        f"email={n_delete_email}, unreachable={n_delete_unreachable}, "
        f"пропуск unreachable={n_skip_unreachable}, "
        f"обновлено score={n_update}"
        + (" [DRY-RUN]" if args.dry_run else ""),
        file=sys.stderr,
    )


if __name__ == "__main__":
    main()
