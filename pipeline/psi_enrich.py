"""
Второй слой: PageSpeed Insights (mobile) для лидов с email после finder.

Заполняет leads.psi_mobile_score и leads.psi_checked_at.
Используйте перед экспортом/рассылкой с --psi-slow-only (score < порога).
"""

from __future__ import annotations

import argparse
import os
import sys
import time
from pathlib import Path

try:
    from dotenv import load_dotenv
except ImportError:
    load_dotenv = None  # type: ignore[misc, assignment]

from leads_db import DEFAULT_DB_PATH, connect, init_db
from pagespeed import fetch_psi_mobile_score


def resolve_api_key() -> str:
    return (
        os.environ.get("PAGESPEED_API_KEY", "").strip()
        or os.environ.get("GOOGLE_API_KEY", "").strip()
    )


def run_enrich(
    db_path: Path,
    *,
    limit: int,
    delay_s: float,
    force: bool,
) -> tuple[int, int]:
    key = resolve_api_key()
    if not key:
        print(
            "Задайте PAGESPEED_API_KEY (или GOOGLE_API_KEY) в pipeline/.env — ключ из Google Cloud.",
            file=sys.stderr,
        )
        sys.exit(1)

    init_db(db_path)
    conn = connect(db_path)
    try:
        if force:
            cur = conn.execute(
                """
                SELECT id, url FROM leads
                WHERE email IS NOT NULL AND TRIM(email) != '' AND email LIKE '%@%'
                ORDER BY score DESC, id DESC
                LIMIT ?
                """,
                (limit,),
            )
        else:
            cur = conn.execute(
                """
                SELECT id, url FROM leads
                WHERE email IS NOT NULL AND TRIM(email) != '' AND email LIKE '%@%'
                  AND psi_checked_at IS NULL
                ORDER BY score DESC, id DESC
                LIMIT ?
                """,
                (limit,),
            )
        rows = cur.fetchall()
    finally:
        conn.close()

    if not rows:
        print("Нет строк для обработки (или все уже с psi_checked_at без --force).")
        return 0, 0

    conn = connect(db_path)
    ok = 0
    fail = 0
    try:
        for row in rows:
            lid, url = int(row["id"]), str(row["url"])
            score = fetch_psi_mobile_score(url, key)
            from datetime import datetime, timezone

            checked = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
            conn.execute(
                """
                UPDATE leads SET psi_mobile_score = ?, psi_checked_at = ?, updated_at = ?
                WHERE id = ?
                """,
                (score, checked, checked, lid),
            )
            conn.commit()
            ok += 1
            if score is None:
                fail += 1
                print(f"[{ok}/{len(rows)}] id={lid} PSI=None (ошибка API или нет данных) {url[:60]}…")
            else:
                print(f"[{ok}/{len(rows)}] id={lid} PSI={score} {url[:60]}…")
            if ok < len(rows) and delay_s > 0:
                time.sleep(delay_s)
    finally:
        conn.close()

    return ok, fail


def main() -> None:
    if load_dotenv:
        load_dotenv(Path(__file__).resolve().parent / ".env")

    ap = argparse.ArgumentParser(description="Обогатить лиды PSI mobile score")
    ap.add_argument("--db", default=str(DEFAULT_DB_PATH), help="Путь к leads.db")
    ap.add_argument("--limit", type=int, default=25, help="Макс. URL за запуск")
    ap.add_argument(
        "--delay",
        type=float,
        default=1.5,
        help="Пауза между запросами к API (сек)",
    )
    ap.add_argument(
        "--force",
        action="store_true",
        help="Пересчитать даже если psi_checked_at уже есть",
    )
    args = ap.parse_args()
    db_path = Path(args.db)
    n, fails = run_enrich(db_path, limit=args.limit, delay_s=args.delay, force=args.force)
    print(f"Готово: обработано {n} URL (без числового score: {fails}).")


if __name__ == "__main__":
    main()
