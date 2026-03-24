"""
Пакетный сбор лидов в leads.db: несколько ниш подряд, пока не наберётся цель.

Использует finder.search_leads + DDG. Для рассылки по умолчанию --require-email
(только строки с email на домене сайта).

Пример:
  python collect_leads.py --target 1000
  python collect_leads.py --target 500 --min-score 4 --sleep-between 3
"""

from __future__ import annotations

import argparse
import random
import sqlite3
import sys
import time
from pathlib import Path

from finder import search_leads
from leads_db import DEFAULT_DB_PATH, init_db, save_rows_from_finder

# SMB-ниши (англ. запросы → те же рынки, что ENGLISH_MARKETS в finder)
DEFAULT_NICHES: tuple[str, ...] = (
    "plumbing service",
    "electrician",
    "roofing contractor",
    "hvac repair",
    "house cleaning",
    "dentist",
    "veterinary clinic",
    "barber shop",
    "pizza restaurant",
    "auto repair shop",
    "landscaping",
    "dry cleaning",
    "family law attorney",
    "cpa accountant",
    "real estate agent",
    "wedding photographer",
    "fitness gym",
    "beauty salon",
    "pet grooming",
    "carpet cleaning",
    "pest control",
    "locksmith",
    "moving company",
    "tree service",
    "flooring contractor",
    "painting contractor",
    "handyman",
    "window cleaning",
    "pool service",
    "chiropractor",
    "optometrist",
    "florist",
    "bakery cafe",
    "coffee shop",
    "car wash",
    "storage facility",
    "self storage",
    "insurance agency",
    "financial advisor",
    "home inspector",
    "appliance repair",
    "fence contractor",
    "concrete contractor",
    "masonry contractor",
    "siding contractor",
    "gutter cleaning",
    "solar panel installer",
    "generator installation",
    "water damage restoration",
    "catering service",
    "event venue",
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
    ap = argparse.ArgumentParser(description="Сбор лидов в SQLite до целевого числа")
    ap.add_argument("--target", type=int, default=1000, help="Сколько лидов с email (по умолчанию 1000)")
    ap.add_argument("--db", type=Path, default=DEFAULT_DB_PATH, help="Путь к leads.db")
    ap.add_argument("--min-score", type=int, default=5, help="Мин. score finder (1–10)")
    ap.add_argument(
        "--allow-no-email",
        action="store_true",
        help="Сохранять лиды без email; по умолчанию только с email (для рассылки)",
    )
    ap.add_argument("--per-query", type=int, default=10, help="Результатов DDG на подзапрос")
    ap.add_argument("--delay", type=float, default=0.35, help="Пауза между запросами к сайтам (finder)")
    ap.add_argument(
        "--sleep-between",
        type=float,
        default=2.0,
        help="Пауза между нишами (сек), снижает риск лимита DDG",
    )
    ap.add_argument(
        "--per-niche-limit",
        type=int,
        default=60,
        help="Макс. новых подходящих строк за один проход по нише",
    )
    ap.add_argument("--max-rounds", type=int, default=80, help="Стоп после стольких полных кругов по списку ниш")
    args = ap.parse_args()

    require_email = not args.allow_no_email
    db_path = args.db.resolve()
    niches = list(DEFAULT_NICHES)

    start_count = count_with_email(db_path)
    print(
        f"База {db_path}: сейчас лидов с email: {start_count}. Цель: {args.target}.",
        file=sys.stderr,
    )
    if start_count >= args.target:
        print("Цель уже достигнута.", file=sys.stderr)
        return

    round_no = 0
    while round_no < args.max_rounds:
        round_no += 1
        random.shuffle(niches)
        for niche in niches:
            cur = count_with_email(db_path)
            if cur >= args.target:
                print(
                    f"Готово: {cur} лидов с email (цель {args.target}).",
                    file=sys.stderr,
                )
                return
            need = args.target - cur
            lim = min(args.per_niche_limit, max(need + 15, 30))
            print(
                f"[r{round_no}] {niche!r} … нужно ещё ~{need}, limit={lim}",
                file=sys.stderr,
                flush=True,
            )
            try:
                rows = search_leads(
                    niche,
                    "",
                    per_query=args.per_query,
                    min_score=args.min_score,
                    delay_s=args.delay,
                    require_email=require_email,
                    limit=lim,
                    single_region=False,
                )
            except Exception as e:
                print(f"Ошибка search_leads({niche!r}): {e}", file=sys.stderr)
                time.sleep(5)
                continue

            if not rows:
                time.sleep(args.sleep_between)
                continue

            n = save_rows_from_finder(rows, niche=niche, path=db_path)
            new_total = count_with_email(db_path)
            print(
                f"  → сохранено строк: {n}, всего с email: {new_total}",
                file=sys.stderr,
                flush=True,
            )
            time.sleep(args.sleep_between)

    print(
        f"Достигнут max-rounds={args.max_rounds}. Сейчас с email: {count_with_email(db_path)}.",
        file=sys.stderr,
    )


if __name__ == "__main__":
    main()
