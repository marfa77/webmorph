"""
Экспорт в Markdown для рассылки PixID в фотоателье (документные фото).
Берёт до N строк из leads_pixid_studios.db; при нехватке — добирает из leads.db по узкому фильтру (passport / visa URL и т.д.).

Отправка писем: send_outreach.py … send --pixid-photo-studios — каждый адрес пишется в outreach_sent
(тот же файл БД, что в --db), повторная рассылка на тот же email блокируется.

  .venv/bin/python export_pixid_photo_studios_md.py -o outreach-pixid-photo-studios-20.md --limit 20
"""

from __future__ import annotations

import argparse
import re
import sqlite3
from pathlib import Path
from urllib.parse import urlparse

from leads_db import init_db

PIPELINE_DIR = Path(__file__).resolve().parent
DEFAULT_PIXID_DB = PIPELINE_DIR / "leads_pixid_studios.db"
DEFAULT_MAIN_DB = PIPELINE_DIR / "leads.db"

# Ложные срабатывания по запросу «embassy …» / реклама / не студии
_PIXID_URL_HOST_BLOCK = (
    "bing.com",
    "google.com/url",
    "doubleclick",
    "facebook.com",
    "embassybank.com",
    "zarla.com",
    "/aclick?",
    "utm_source=bing",
)

_GENERIC_EMAIL_LOCALS = frozenset(
    {
        "info",
        "contact",
        "hello",
        "sales",
        "support",
        "admin",
        "office",
        "mail",
        "enquiries",
        "inquiries",
        "help",
        "team",
        "tech",
        "espanol",
    }
)

SUBJECT = "ID photo processing — 5 complimentary trial exports for your studio"

BODY_TEMPLATE = """Hi {first_name},

I came across your studio — great work on the photography side. I think there's one upgrade that could make your document-photo service noticeably stronger.

Every country has its own rules for passport and visa photos: head size percentage, background shade, crop, DPI, file format. Keeping up with all of that manually is tedious and easy to get wrong.

Here's what we offer: after you shoot the portrait, upload it to PixID, pick the document type and country. We process the image to the exact spec, run 100+ automated compliance checks, and return the ready file. You hand it to your client — done, no Photoshop, no guessing.

With PixID you can confidently offer passport and visa photos for 60+ countries without spending extra time on post-production. Same studio, bigger service.

To make it easy to try: if you'd like to test the workflow, reply to this email with a short "yes" or "trial" — we'll send you an activation key for five complimentary exports (no card required). Once you confirm you want to try, we'll reply with the key and short setup steps.

Studio pricing and bundles (for after the trial):
https://www.pixid.studio/agencies/studios

If you can also mention your city and roughly how many document-photo sessions you do per month, we'll tailor the follow-up.

Pavel
CEO, PixID
https://www.pixid.studio
customer@pixid.studio

P.S. Not relevant? Just delete — no automated follow-ups."""


def _row_ok_for_pixid(r: dict) -> bool:
    u = (r.get("url") or "").lower()
    h = (r.get("host") or "").lower()
    blob = f"{u} {h}"
    return not any(b in blob for b in _PIXID_URL_HOST_BLOCK)


def first_name_from_email(email: str) -> str:
    local = (email or "").split("@", 1)[0].strip().lower()
    if not local:
        return "there"
    part = re.split(r"[._+-]", local, maxsplit=1)[0]
    if not part or part in _GENERIC_EMAIL_LOCALS:
        return "there"
    if not part.isalpha():
        return "there"
    return part[:1].upper() + part[1:].lower() if len(part) > 1 else part.upper()


def _fetch_pixid(conn: sqlite3.Connection, limit: int) -> list[dict]:
    cur = conn.execute(
        """
        SELECT url, host, email, niche
        FROM leads
        WHERE email IS NOT NULL AND trim(email) != ''
        ORDER BY id DESC
        LIMIT ?
        """,
        (limit,),
    )
    return [dict(zip([c[0] for c in cur.description], row)) for row in cur.fetchall()]


def _fetch_topup(conn: sqlite3.Connection, limit: int, exclude_hosts: set[str]) -> list[dict]:
    cur = conn.execute(
        """
        SELECT url, host, email, niche
        FROM leads
        WHERE email IS NOT NULL AND trim(email) != ''
          AND (
            lower(COALESCE(niche,'')) LIKE '%passport%'
            OR lower(COALESCE(niche,'')) LIKE '%visa photo%'
            OR lower(COALESCE(niche,'')) LIKE '%biometric%'
            OR lower(COALESCE(niche,'')) LIKE '%document photo%'
            OR lower(COALESCE(url,'')) LIKE '%passport%photo%'
            OR lower(COALESCE(url,'')) LIKE '%visa%photo%'
          )
        ORDER BY id DESC
        """
    )
    out: list[dict] = []
    for row in cur.fetchall():
        r = dict(zip([c[0] for c in cur.description], row))
        h = (r.get("host") or "").lower().lstrip("www.")
        if h in exclude_hosts:
            continue
        out.append(r)
        if len(out) >= limit:
            break
    return out


def export_md(
    out_path: Path,
    *,
    pixid_db: Path,
    main_db: Path,
    limit: int,
    top_up: bool,
) -> tuple[int, str]:
    init_db(pixid_db)
    init_db(main_db)

    rows: list[dict] = []
    note = ""

    conn_p = sqlite3.connect(str(pixid_db))
    conn_p.row_factory = sqlite3.Row
    try:
        raw = [dict(r) for r in _fetch_pixid(conn_p, limit * 3)]
        rows = [r for r in raw if _row_ok_for_pixid(r)][:limit]
    finally:
        conn_p.close()

    if len(rows) < limit and top_up:
        seen = {((r.get("host") or "").lower().lstrip("www.")) for r in rows}
        conn_m = sqlite3.connect(str(main_db))
        try:
            extra_raw = _fetch_topup(conn_m, (limit - len(rows)) * 4, seen)
            extra = [r for r in extra_raw if _row_ok_for_pixid(r)][
                : limit - len(rows)
            ]
        finally:
            conn_m.close()
        rows.extend(extra)
        if extra:
            note = f"Добрано из {main_db.name}: {len(extra)} строк (узкий фильтр passport/visa URL).\n"

    lines: list[str] = [
        "# PixID — outreach batch (photo studios / document photos)",
        "",
        "**From:** customer@pixid.studio",
        "",
        f"**Subject:** {SUBJECT}",
        "",
        "---",
        "",
        "## Текст письма (одинаковый; подставьте приветствие по таблице ниже)",
        "",
        "```",
        BODY_TEMPLATE.format(first_name="[Name]"),
        "```",
        "",
        "---",
        "",
        f"## Получатели ({len(rows)} адресов из БД, строк в таблице {limit})",
        "",
        note if note else "",
        "| # | To | Host | URL | Niche (поиск) |",
        "|---|-----|------|-----|----------------|",
    ]

    for i, r in enumerate(rows, start=1):
        em = r.get("email") or "—"
        host = r.get("host") or urlparse(r.get("url") or "").netloc.lower().lstrip("www.") or "—"
        url = r.get("url") or "—"
        niche = r.get("niche") or "—"
        lines.append(f"| {i} | {em} | {host} | {url} | {niche} |")

    for i in range(len(rows) + 1, limit + 1):
        lines.append(f"| {i} | | | | |")

    if len(rows) < limit:
        lines.extend(
            [
                "",
                f"*Строки {len(rows) + 1}–{limit}: заполните после сбора или перезапустите экспорт, когда `collect_pixid_photo_studios.py` наберёт базу.*",
                "",
                "```bash",
                f".venv/bin/python export_pixid_photo_studios_md.py -o {out_path.name} --limit {limit}",
                "```",
            ]
        )

    lines.extend(
        [
            "",
            "---",
            "",
            "## Персонализация Hi …",
            "",
            "| # | Hi |",
            "|---|-----|",
        ]
    )
    for i, r in enumerate(rows, start=1):
        fn = first_name_from_email(r.get("email") or "")
        lines.append(f"| {i} | Hi {fn}, |")
    for i in range(len(rows) + 1, limit + 1):
        lines.append(f"| {i} | Hi there, |")

    out_path.write_text("\n".join(lines), encoding="utf-8")
    return len(rows), note


def main() -> None:
    ap = argparse.ArgumentParser(description="Экспорт MD для рассылки PixID (фотоателье)")
    ap.add_argument(
        "-o",
        "--output",
        type=Path,
        default=PIPELINE_DIR / "outreach-pixid-photo-studios-20.md",
        help="Файл Markdown",
    )
    ap.add_argument("--limit", type=int, default=20, help="Макс. строк в таблице")
    ap.add_argument(
        "--pixid-db",
        type=Path,
        default=DEFAULT_PIXID_DB,
        help="База collect_pixid_photo_studios.py",
    )
    ap.add_argument(
        "--main-db",
        type=Path,
        default=DEFAULT_MAIN_DB,
        help="Основная leads.db для добора",
    )
    ap.add_argument(
        "--no-top-up",
        action="store_true",
        help="Не добирать из leads.db",
    )
    args = ap.parse_args()

    n, note = export_md(
        args.output.resolve(),
        pixid_db=args.pixid_db.resolve(),
        main_db=args.main_db.resolve(),
        limit=args.limit,
        top_up=not args.no_top_up,
    )
    print(f"OK: {n} строк → {args.output}" + (f" ({note.strip()})" if note else ""))


if __name__ == "__main__":
    main()
