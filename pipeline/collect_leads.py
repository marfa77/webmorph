"""
Пакетный сбор лидов в leads.db: несколько ниш подряд, пока не наберётся цель.

«Ниша» здесь — не фильтр по типу сайта в коде: это только текст запроса в DuckDuckGo.
Отсев визиток делает finder (WP/CMS, score и т.д.), а не поле niche в БД.
Чтобы больше личных одностраничников — см. PERSONAL_BROCHURE_NICHES и флаг --personal-only.

Использует finder.search_leads + DDG. Для рассылки по умолчанию --require-email.

Пример:
  python collect_leads.py --target 1000
  python collect_leads.py --personal-only --target 200 --global-english
  python collect_leads.py --target 500 --global-english --skip-engine-filter
  python collect_leads.py --target 200 --global-english --max-url-checks 25 --per-query 8
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

# Строки ниже — только шаблоны для DuckDuckGo (ниша ≠ фильтр HTML: визитку не отсекаем по типу).
# Часть списка — SMB, часть — личные сайты / портфолио, чтобы не упускать одностраничники людей.
SMB_NICHES: tuple[str, ...] = (
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
    "tattoo studio",
    "medical spa",
    "acupuncture clinic",
    "towing service",
    "septic tank service",
    "metal fabrication welder",
    "awning company",
    "sign shop",
    "print shop",
    "computer repair shop",
    "it support small business",
    "home security installer",
    "dog trainer",
    "pet sitting service",
    "nail salon",
    "day spa",
    "travel agency",
    "tax preparation service",
    "immigration lawyer",
    "personal injury attorney",
    "boat repair marina",
    "bicycle shop repair",
    "music school lessons",
    "dance studio",
    "martial arts school",
    "bed and breakfast",
    "pilates studio",
    "hvac installation company",
    "epoxy flooring contractor",
    "mobile detailing service",
    "junk removal service",
    "property management company",
    "surveying company land surveyor",
)

PERSONAL_BROCHURE_NICHES: tuple[str, ...] = (
    "freelance web developer portfolio",
    "freelance designer portfolio",
    "life coach personal website",
    "business consultant one page website",
    "independent consultant website",
    "personal trainer website",
    "yoga instructor website",
    "private tutor website",
    "makeup artist portfolio",
    "photography portfolio website",
    "artist portfolio website",
    "musician official website",
    "author speaker website",
    "architect portfolio website",
    "therapist private practice website",
    # Одностраничники / визитки, которые DDG иначе не поднимает в SMB-запросах
    "personal homepage contact email",
    "one page cv resume website",
    "interior designer portfolio website",
    "voice actor personal website",
    "nutritionist dietitian website",
    "massage therapist private practice",
    "driving instructor website",
    "wedding officiant website",
    "notary public website",
    "podcaster personal website",
    "filmmaker portfolio website",
    "copywriter freelance website",
    "illustrator portfolio website",
    "3d artist portfolio",
    "virtual assistant website",
    "freelance bookkeeper website",
    "social media manager freelance",
    "seo consultant freelance website",
    "doula birth support website",
    "private chef personal website",
    "tour guide freelance website",
    "translator interpreter website",
    "event planner personal website",
    "home stager website",
    "data analyst freelance portfolio",
    "ux designer portfolio website",
    "editorial photographer website",
    "stunt performer portfolio",
)

DEFAULT_NICHES: tuple[str, ...] = SMB_NICHES + PERSONAL_BROCHURE_NICHES


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
    ap.add_argument(
        "--allow-any-email",
        action="store_true",
        help="С email на странице, но не требовать @домен-сайта (как finder --allow-any-email)",
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
    ap.add_argument(
        "--global-english",
        action="store_true",
        help="Как finder --global-english: поиск без привязки к стране + проверка англ. страницы",
    )
    ap.add_argument(
        "--skip-engine-filter",
        action="store_true",
        help="Как finder --skip-engine-filter: не отсекать WP/Wix/магазины — иначе выдача DDG почти пустая (мало «чистого» статика)",
    )
    ap.add_argument(
        "--max-url-checks",
        type=int,
        default=40,
        metavar="N",
        help="Уникальных сайтов проверить на нишу за проход (меньше = быстрее; 0 = без лимита, как раньше — очень долго)",
    )
    ap.add_argument(
        "--full-queries",
        action="store_true",
        help="С --global-english: все 12 подзапросов DDG (медленнее; по умолчанию 5)",
    )
    ap.add_argument(
        "--personal-only",
        action="store_true",
        help="Только личные/портфолио-ниши (PERSONAL_BROCHURE_NICHES), без SMB",
    )
    ap.add_argument(
        "--smb-only",
        action="store_true",
        help="Только SMB-ниши (SMB_NICHES), без личных сайтов",
    )
    ap.add_argument(
        "--niches-file",
        type=Path,
        default=None,
        metavar="PATH",
        help="Файл UTF-8: доп. ниши по одной строке (# — комментарий до конца строки); добавляется к SMB/Personal/DEFAULT",
    )
    args = ap.parse_args()

    require_email = not args.allow_no_email
    db_path = args.db.resolve()
    if args.personal_only and args.smb_only:
        print("Нельзя одновременно --personal-only и --smb-only", file=sys.stderr)
        sys.exit(1)
    if args.personal_only:
        niches = list(PERSONAL_BROCHURE_NICHES)
    elif args.smb_only:
        niches = list(SMB_NICHES)
    else:
        niches = list(DEFAULT_NICHES)

    if args.niches_file:
        p = args.niches_file.resolve()
        if not p.is_file():
            print(f"Нет файла --niches-file: {p}", file=sys.stderr)
            sys.exit(1)
        raw = p.read_text(encoding="utf-8")
        extra: list[str] = []
        for line in raw.splitlines():
            s = line.split("#", 1)[0].strip()
            if s:
                extra.append(s)
        base_n = len(niches)
        niches = niches + extra
        niches = list(dict.fromkeys(niches))
        print(
            f"{p.name}: строк в файле {len(extra)}, ниш до слияния {base_n}, уникальных после: {len(niches)}",
            file=sys.stderr,
        )

    start_count = count_with_email(db_path)
    print(
        f"База {db_path}: сейчас лидов с email: {start_count}. Цель: {args.target}.",
        file=sys.stderr,
    )
    if args.skip_engine_filter:
        print(
            "Режим --skip-engine-filter: в базу попадут и сайты на CMS/конструкторах (объём выше, ICP шире).",
            file=sys.stderr,
        )
    if args.max_url_checks > 0:
        print(
            f"Скорость: до {args.max_url_checks} URL на нишу (--max-url-checks 0 = без лимита, очень долго).",
            file=sys.stderr,
        )
    if args.global_english and not args.full_queries:
        print(
            "DDG: укороченные запросы (5 вместо 12) — быстрее; полный охват: --full-queries.",
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
                    global_english=args.global_english,
                    skip_engine_filter=args.skip_engine_filter,
                    lite_global_queries=args.global_english and not args.full_queries,
                    max_url_checks=(
                        None if args.max_url_checks <= 0 else args.max_url_checks
                    ),
                    allow_any_page_email=args.allow_any_email,
                )
            except Exception as e:
                print(f"Ошибка search_leads({niche!r}): {e}", file=sys.stderr)
                time.sleep(5)
                continue

            if not rows:
                if not args.skip_engine_filter:
                    print(
                        "  → 0 кандидатов (часто вся выдача — WP/Wix; для объёма запустите с --skip-engine-filter)",
                        file=sys.stderr,
                        flush=True,
                    )
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
