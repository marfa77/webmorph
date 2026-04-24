"""
Чистка leads_pixid_studios.db от явно не-студий: онлайн-генераторы, порталы, блоги, маркетплейсы.

По умолчанию только отчёт (--dry-run). Реальное удаление: --apply

  .venv/bin/python clean_pixid_photo_leads.py --dry-run
  .venv/bin/python clean_pixid_photo_leads.py --apply

Не трогает строки, по которым уже был outreach (outreach_sent), если не указано --include-sent.
"""

from __future__ import annotations

import argparse
import sqlite3
import sys
from pathlib import Path
from urllib.parse import urlparse

from leads_db import init_db

PIPELINE_DIR = Path(__file__).resolve().parent
DEFAULT_DB = PIPELINE_DIR / "leads_pixid_studios.db"

# Подстрока в host (нижний регистр) → мусор для ICP «локальное фотоателье»
_HOST_REJECT_SUBSTR: tuple[str, ...] = (
    # Крупные онлайн-сервисы паспортных фото
    "visafoto.com",
    "cutout.pro",
    "photoaid.com",
    "passport-photo.online",
    "passport-photos.ai",
    "passportphotoapp.com",
    "instantpassportimage",
    "passportphoto.",
    "idphoto4you",
    "123passportphoto",
    "persofoto",
    "ipassportphoto",
    "epassportphoto.com",
    "makepassportphoto",
    "photobooth.online",
    "photoaid.",
    "aiease.ai",
    "hzqihui.com",
    "servframe.com",
    "wpforphotographers",
    "softwaremunch.com",
    "stylecraze.com",
    "thehill.com",
    "foreignpolicy",
    "cnn.com",
    "bbc.co",
    "wikipedia.org",
    "youtube.com",
    "facebook.com",
    "linkedin.com",
    "pinterest.com",
    "instagram.com",
    "tiktok.com",
    "amazon.",
    "ebay.",
    "etsy.com",
    "shutterstock",
    "gettyimages",
    "alamy.com",
    "dreamstime",
    "bing.com",
    "google.com",
    "yahoo.com",
    "reddit.com",
    "medium.com",
    "substack.com",
    "wordpress.com",
    "blogspot.",
    "tumblr.com",
    "expat.com",
    "tripadvisor",
    "yelp.com",
    "houzz.com",
    "bbb.org",
    "manta.com",
    "yellowpages",
    "fiverr.com",
    "upwork.com",
    "gumroad.com",  # если попал лендинг продукта, не студия
    "sentry.io",
    "wixpress.com",
    "mapquest.com",
    "durable.co",
    "media.io",
    "moo.com",
    "vista.com",
    "passportphotos.com",
    "snap2pass.com",
    "describeimage.ai",
    "faceseek.online",
    "photogov.net",
    "visapics.org",
    "fluxai.art",
    "globalvisaphoto",
    "bookingaphotographer",
    "softmizeappstudio",
    "mojodocs.in",
    "educba.com",
    "servicephoto.com",
    "epson.",
    "oup.com",
)

# Подстроки в path URL — статьи, каталоги, не визитка студии
_URL_PATH_REJECT: tuple[str, ...] = (
    "/blog/",
    "/blogs/",
    "/article/",
    "/articles/",
    "/news/",
    "/category/",
    "/tag/",
    "/wiki/",
    "/how-to",
    "/top-10",
    "/best-",
    "photo-editing-passport",
)


def _norm_host(host: str) -> str:
    h = (host or "").strip().lower()
    return h[4:] if h.startswith("www.") else h


def _reject_reason(url: str, host: str) -> str | None:
    h = _norm_host(host)
    u = (url or "").lower()
    try:
        path = urlparse(u).path.lower()
    except Exception:
        path = u
    blob = f"{h} {u}"
    for s in _HOST_REJECT_SUBSTR:
        if s in h or s in blob:
            return f"host/saas:{s}"
    for p in _URL_PATH_REJECT:
        if p in u or p in path:
            return f"path:{p}"
    return None


def pixid_junk_email_domain(email: str) -> bool:
    """Домен адреса — тот же мусор, что и для host (SaaS, агрегаторы)."""
    if "@" not in (email or ""):
        return False
    dom = email.split("@", 1)[1].strip().lower()
    for s in _HOST_REJECT_SUBSTR:
        if s in dom:
            return True
    return False


def _null_outreach_for_lead(conn: sqlite3.Connection, lead_id: int) -> None:
    conn.execute("UPDATE outreach_sent SET lead_id = NULL WHERE lead_id = ?", (lead_id,))


def main() -> None:
    ap = argparse.ArgumentParser(description="Чистка leads_pixid_studios от нерелевантных сайтов")
    ap.add_argument("--db", type=Path, default=DEFAULT_DB, help="SQLite (по умолчанию leads_pixid_studios.db)")
    ap.add_argument(
        "--apply",
        action="store_true",
        help="Удалить строки (иначе только отчёт)",
    )
    ap.add_argument(
        "--include-sent",
        action="store_true",
        help="Удалять даже если на email уже был outreach_sent (по умолчанию такие строки сохраняем)",
    )
    ap.add_argument(
        "--blocklist-file",
        type=Path,
        default=None,
        help="Файл: доп. подстроки для host (одна на строка, # комментарий)",
    )
    args = ap.parse_args()
    db_path = args.db.resolve()
    if not db_path.is_file():
        print(f"Нет файла: {db_path}", file=sys.stderr)
        sys.exit(1)

    extra: list[str] = []
    if args.blocklist_file and args.blocklist_file.is_file():
        for line in args.blocklist_file.read_text(encoding="utf-8").splitlines():
            s = line.split("#", 1)[0].strip().lower()
            if s:
                extra.append(s)

    init_db(db_path)
    conn = sqlite3.connect(str(db_path))
    conn.row_factory = sqlite3.Row
    try:
        cur = conn.execute(
            "SELECT id, url, host, email, niche FROM leads ORDER BY id ASC"
        )
        rows = cur.fetchall()
    finally:
        pass

    to_delete: list[tuple[int, str, str, str]] = []
    skipped_sent = 0

    for row in rows:
        lid = int(row["id"])
        url = row["url"] or ""
        host = row["host"] or ""
        email = (row["email"] or "").strip()

        if not args.include_sent and email:
            ex = conn.execute(
                "SELECT 1 FROM outreach_sent WHERE lower(email) = lower(?) LIMIT 1",
                (email,),
            ).fetchone()
            if ex:
                skipped_sent += 1
                continue

        reason = _reject_reason(url, host)
        if extra and not reason:
            h = _norm_host(host)
            for s in extra:
                if s in h or s in url.lower():
                    reason = f"file:{s}"
                    break

        if reason:
            to_delete.append((lid, url, email or "—", reason))

    print(
        f"База: {db_path} | строк всего: {len(rows)} | к удалению: {len(to_delete)} | "
        f"пропуск (уже outreach_sent): {skipped_sent}",
        file=sys.stderr,
    )
    for lid, url, em, reason in to_delete[:80]:
        print(f"  DELETE id={lid} | {reason} | {em} | {url[:90]}", file=sys.stderr)
    if len(to_delete) > 80:
        print(f"  … ещё {len(to_delete) - 80} строк", file=sys.stderr)

    if not args.apply:
        print("Режим просмотра. Для удаления добавьте --apply", file=sys.stderr)
        return

    n = 0
    for lid, _, _, _ in to_delete:
        _null_outreach_for_lead(conn, lid)
        conn.execute("DELETE FROM leads WHERE id = ?", (lid,))
        n += 1
    conn.commit()
    print(f"Удалено строк: {n}", file=sys.stderr)


if __name__ == "__main__":
    main()
