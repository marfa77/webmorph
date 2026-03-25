"""
Экспорт лидов из leads.db в Markdown: таблица To + Subject + текст письма.
Фильтрует известные не-локальные / новостные домены.
"""

from __future__ import annotations

import argparse
import re
import sqlite3
from pathlib import Path
from urllib.parse import urlparse

from leads_db import DEFAULT_DB_PATH, init_db

# Локальная часть ящика без «имени человека»
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
    }
)


def first_name_from_email(email: str) -> str:
    """Короткое имя для приветствия; иначе there."""
    local = (email or "").split("@", 1)[0].strip().lower()
    if not local:
        return "there"
    part = re.split(r"[._+-]", local, maxsplit=1)[0]
    if not part or part in _GENERIC_EMAIL_LOCALS:
        return "there"
    if not part.isalpha():
        return "there"
    return part[:1].upper() + part[1:].lower() if len(part) > 1 else part.upper()


# Домены, которые не стоит холодно писать (новости, агрегаторы, туториалы)
_HOST_BLOCK_SUBSTR = (
    "wpbeginner.com",
    "foreignpolicy.com",
    "fivethirtyeight.com",
    "thesun.co.uk",
    "servicemarket.com",
    "digiobserver.com",
    "samedaypros.com",
    "getuaejobs.com",
    "ukstartups.org",
    "electricianschooledu.org",
    "keyglobalimmigration.com",
    "locallife.co.uk",
    "iconape.com",
    "did.ie",  # крупный ритейл IE — не барбер
    "curlytales.com",
    "acciyo.com",
    "businessegy.com",
    "breaklineagency.com",
    "3ecpa.co.uk",
    "hazlewoods.co.uk",
    "simmonsinc.com",
)

def subject_problem(host: str, psi_mobile: int | None = None, max_len: int = 78) -> str:
    """Тема: при наличии PSI — конкретный балл; иначе общая формулировка."""
    if psi_mobile is not None:
        s = f"{host} — {psi_mobile}/100 mobile speed"
        if len(s) <= max_len:
            return s
        s = f"{host} — mobile PageSpeed {psi_mobile}/100"
        if len(s) <= max_len:
            return s
        return s[: max_len - 1].rstrip() + "…"
    s = f"{host} — feels slow & dated on mobile vs 2026 expectations"
    if len(s) <= max_len:
        return s
    s = f"{host} — slow on phones, looks dated (2026)"
    if len(s) <= max_len:
        return s
    return s[: max_len - 1].rstrip() + "…"


EMAIL_BODY_WITH_PSI = """Hi {first_name},

{host} scores {psi}/100 on mobile speed (Google PageSpeed) — that's costing you leads.

We'll rebuild it free. You see it before you pay. Keep it → $100.

Reply "yes" to see your new site.

Pavel · webmorp
https://www.webmorp.art"""


EMAIL_BODY_GENERIC = """Hi {first_name},

We came across {host} — the site is easy to find, but it can feel slower or older than what visitors expect in 2026, especially on phones. That costs trust and clicks.

I'm Pavel, CEO of webmorp (https://www.webmorp.art). Full redesign free first — you see everything before you pay. Keep it → $100. Deploy on your domain → +$100.

What you get: a fast, striking site with a premium look — built on our 2026 blueprint, fully responsive (desktop + mobile), SEO copy from your pages, new AI visuals. Pick a template on webmorp.art or we choose from experience; examples are on the site.

Reply "yes" to queue.

Thanks,
Pavel
CEO, webmorp
webmorp.art"""


def build_email_body(host: str, email: str, psi_mobile: int | None) -> str:
    """Текст письма: с персонализацией PSI или общий вариант."""
    fn = first_name_from_email(email)
    if psi_mobile is not None:
        return EMAIL_BODY_WITH_PSI.format(first_name=fn, host=host, psi=psi_mobile)
    return EMAIL_BODY_GENERIC.format(first_name=fn, host=host)


def _blocked(host: str) -> bool:
    h = host.lower()
    return any(b in h for b in _HOST_BLOCK_SUBSTR)


def export_md(
    out_path: Path,
    db_path: Path,
    limit: int = 50,
    *,
    psi_slow_only: bool = False,
    psi_threshold: int = 55,
) -> tuple[int, int]:
    init_db(db_path)
    conn = sqlite3.connect(str(db_path))
    conn.row_factory = sqlite3.Row
    where = "WHERE email IS NOT NULL AND email != ''"
    params: list = []
    if psi_slow_only:
        where += " AND psi_mobile_score IS NOT NULL AND psi_mobile_score < ?"
        params.append(int(psi_threshold))
    cur = conn.execute(
        f"""
        SELECT url, host, email, score, reasons, niche, id, psi_mobile_score, psi_checked_at
        FROM leads
        {where}
        ORDER BY score DESC, id DESC
        """,
        params,
    )
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()

    kept: list[dict] = []
    for r in rows:
        if _blocked(r["host"]):
            continue
        kept.append(r)
        if len(kept) >= limit:
            break

    filt_note = ""
    if psi_slow_only:
        filt_note = f" Фильтр PSI: mobile &lt; {psi_threshold} (только с измеренным score)."

    lines: list[str] = [
        "# Outreach batch 2 — автогенерация из leads.db",
        "",
        f"Сгенерировано из базы: `{db_path.name}`. В документе **{len(kept)}** лидов (макс. {limit}) после фильтра доменов.{filt_note} Проверь To и URL вручную перед отправкой.",
        "",
        "От кого: `customer@pixid.studio` · Pavel, CEO, webmorp · https://www.webmorp.art",
        "",
        "## Тема письма (Subject)",
        "",
        "В теме — **сама проблема с сайтом** (медленно / устарело / особенно на телефонах), в том же духе, что первый абзац письма. Без бренда webmorp в теме — бренд в From и подписи.",
        "",
        "---",
        "",
    ]

    for i, r in enumerate(kept, start=1):
        host = r["host"] or urlparse(r["url"]).netloc.lower().lstrip("www.")
        em = r["email"]
        psi = r.get("psi_mobile_score")
        subj = subject_problem(host, psi_mobile=psi if psi is not None else None)
        lines.append(f"## {i} — {host}")
        lines.append("")
        lines.append("| Поле | Значение |")
        lines.append("|------|----------|")
        lines.append(f"| To | {em} |")
        lines.append(f"| Subject | {subj} |")
        lines.append(f"| URL (лид) | {r['url']} |")
        lines.append(f"| Score (finder) | {r['score']} |")
        lines.append(f"| PSI mobile | {psi if psi is not None else '—'} |")
        lines.append(f"| Niche (поиск) | {r.get('niche') or '—'} |")
        lines.append("")
        lines.append("Body:")
        lines.append("")
        lines.append(build_email_body(host, em, psi if psi is not None else None))
        lines.append("")
        lines.append("---")
        lines.append("")

    lines.append("## Сводка email")
    lines.append("")
    lines.append("| # | Email | Host |")
    lines.append("|---|--------|------|")
    for i, r in enumerate(kept, start=1):
        h = r["host"] or ""
        lines.append(f"| {i} | {r['email']} | {h} |")

    out_path.write_text("\n".join(lines), encoding="utf-8")
    return len(kept), len(rows)


def main() -> None:
    ap = argparse.ArgumentParser(description="Экспорт outreach MD из leads.db")
    ap.add_argument(
        "-o",
        "--out",
        default=str(Path(__file__).resolve().parent / "outreach-batch-2.md"),
        help="Выходной .md",
    )
    ap.add_argument("--db", default=str(DEFAULT_DB_PATH), help="Путь к leads.db")
    ap.add_argument("--limit", type=int, default=50, help="Макс. строк после фильтра")
    ap.add_argument(
        "--psi-slow-only",
        action="store_true",
        help="Только лиды с psi_mobile_score < порога (нужен предварительный psi_enrich.py)",
    )
    ap.add_argument(
        "--psi-threshold",
        type=int,
        default=55,
        help="Порог «медленный сайт» для --psi-slow-only (по умолчанию 55)",
    )
    args = ap.parse_args()
    n, total = export_md(
        Path(args.out),
        Path(args.db),
        limit=args.limit,
        psi_slow_only=args.psi_slow_only,
        psi_threshold=args.psi_threshold,
    )
    print(f"Exported {n} leads (email rows in DB before filter: {total}) → {args.out}")


if __name__ == "__main__":
    main()
