"""
Один скрипт — набор англоязычных DDG-запросов про фотоателье / документные фото.
Пишет в отдельную SQLite (по умолчанию leads_pixid_studios.db), пока не наберётся цель по лидам с email.

Пример:
  .venv/bin/python collect_pixid_photo_studios.py --target 300

Перед записью в БД отсекаются URL по тем же эвристикам, что и clean_pixid_photo_leads.py
(SaaS паспортных фото, /news/, /how-to, bing и т.д.).
"""

from __future__ import annotations

import argparse
from typing import Any
import random
import sqlite3
import sys
import time
from pathlib import Path
from urllib.parse import urlparse

from clean_pixid_photo_leads import _reject_reason
from finder import search_leads
from leads_db import init_db, save_rows_from_finder

DEFAULT_DB = Path(__file__).resolve().parent / "leads_pixid_studios.db"


def _host_from_url(url: str) -> str:
    try:
        h = urlparse(url).netloc.lower()
        return h[4:] if h.startswith("www.") else h
    except Exception:
        return ""


def _filter_pixid_junk(rows: list[Any]) -> tuple[list[Any], int]:
    """Те же правила, что clean_pixid_photo_leads — не писать SaaS/статьи в базу."""
    kept, skipped = [], 0
    for r in rows:
        url = getattr(r, "url", "") or ""
        rr = _reject_reason(url, _host_from_url(url))
        if rr:
            skipped += 1
            continue
        kept.append(r)
    return kept, skipped


# Запросы к DuckDuckGo (англ.), глобально + фильтр англ. страницы через finder --global-english
DEFAULT_QUERIES: tuple[str, ...] = (
    "passport photo studio",
    "visa photo studio",
    "ID photo service",
    "biometric photo studio",
    "document photo studio",
    "passport pictures studio",
    "photo studio passport visa",
    "instant passport photo",
    "professional photo studio portraits",
    "passport photo printing",
    "ID photo printing shop",
    "embassy photo studio",
    "passport and visa photos",
)


def count_with_email(db_path: Path) -> int:
    init_db(db_path)
    conn = sqlite3.connect(str(db_path))
    try:
        cur = conn.execute(
            "SELECT COUNT(*) FROM leads WHERE email IS NOT NULL AND trim(email) != ''"
        )
        return int(cur.fetchone()[0])
    finally:
        conn.close()


def main() -> None:
    ap = argparse.ArgumentParser(
        description="Сбор лидов фотоателье (PixID): один запуск, встроенный список DDG-запросов",
    )
    ap.add_argument("--target", type=int, default=100, help="Сколько лидов с email (по умолчанию 100)")
    ap.add_argument("--db", type=Path, default=DEFAULT_DB, help="Путь к SQLite")
    ap.add_argument("--min-score", type=int, default=3, help="Мин. score finder (1–10)")
    ap.add_argument("--per-query", type=int, default=15, help="Результатов DDG на подзапрос")
    ap.add_argument(
        "--per-run-limit",
        type=int,
        default=35,
        help="Макс. подходящих лидов за один проход по одной фразе",
    )
    ap.add_argument(
        "--max-url-checks",
        type=int,
        default=150,
        help="Уникальных URL на фразу (0 = без лимита)",
    )
    ap.add_argument(
        "--sleep-between",
        type=float,
        default=2.0,
        help="Пауза между фразами (сек)",
    )
    ap.add_argument("--max-rounds", type=int, default=40, help="Макс. полных кругов по списку фраз")
    ap.add_argument(
        "--domain-email-only",
        action="store_true",
        help="Только email на домене сайта (медленнее, меньше строк)",
    )
    args = ap.parse_args()

    db_path = args.db.resolve()
    queries = list(DEFAULT_QUERIES)
    allow_any = not args.domain_email_only
    max_uc = None if args.max_url_checks <= 0 else args.max_url_checks

    print(
        f"База: {db_path} | цель: {args.target} лидов с email | "
        f"{'any-email' if allow_any else 'domain-email'} | фраз: {len(queries)}",
        file=sys.stderr,
    )

    start = count_with_email(db_path)
    if start >= args.target:
        print(f"Уже {start} ≥ {args.target}. Выход.", file=sys.stderr)
        return

    round_no = 0
    while round_no < args.max_rounds:
        round_no += 1
        random.shuffle(queries)
        for q in queries:
            cur = count_with_email(db_path)
            if cur >= args.target:
                print(f"Готово: {cur} лидов с email.", file=sys.stderr)
                return
            need = args.target - cur
            lim = min(args.per_run_limit, max(need + 5, 15))
            print(f"[r{round_no}] {q!r} … нужно ещё ~{need}, limit={lim}", file=sys.stderr, flush=True)
            try:
                rows = search_leads(
                    q,
                    "",
                    per_query=args.per_query,
                    min_score=args.min_score,
                    delay_s=0.35,
                    require_email=True,
                    limit=lim,
                    single_region=False,
                    global_english=True,
                    skip_engine_filter=True,
                    lite_global_queries=True,
                    max_url_checks=max_uc,
                    allow_any_page_email=allow_any,
                )
            except Exception as e:
                print(f"Ошибка: {e}", file=sys.stderr)
                time.sleep(5)
                continue

            if rows:
                rows, junk = _filter_pixid_junk(rows)
                if junk:
                    print(f"  → отсеяно по ICP: {junk}", file=sys.stderr, flush=True)
                if rows:
                    n = save_rows_from_finder(rows, niche=q, path=db_path)
                    print(
                        f"  → сохранено: {n}, всего с email: {count_with_email(db_path)}",
                        file=sys.stderr,
                        flush=True,
                    )
            time.sleep(args.sleep_between)

    print(
        f"Стоп: max-rounds. Сейчас с email: {count_with_email(db_path)}.",
        file=sys.stderr,
    )


if __name__ == "__main__":
    main()
