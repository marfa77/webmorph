"""
Экспорт лидов из leads.db в Markdown: таблица To + Subject + текст письма.
Фильтрует известные не-локальные / новостные домены.
"""

from __future__ import annotations

import argparse
import sqlite3
from pathlib import Path
from urllib.parse import urlparse

from leads_db import DEFAULT_DB_PATH

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

# Проблема в теме = та же логика, что в первом абзаце (без «рекламных» слов в теме).
# Коротко: скорость + устаревший вид + мобильные.
def subject_problem(host: str, max_len: int = 78) -> str:
    """Subject line: state the site problem (English). Truncate for long domains."""
    s = f"{host} — feels slow & dated on mobile vs 2026 expectations"
    if len(s) <= max_len:
        return s
    s = f"{host} — slow on phones, looks dated (2026)"
    if len(s) <= max_len:
        return s
    return s[: max_len - 1].rstrip() + "…"


EMAIL_TEMPLATE = """Hi,

We came across {host} — the site is easy to find, but it can feel slower or older than what visitors expect in 2026, especially on phones. That costs trust and clicks.

I'm Pavel, CEO of webmorp (https://webmorp.art). Full redesign free first — you see everything before you pay. Keep it → $100. Deploy on your domain → +$100.

What you get: a fast, striking site with a premium look — built on our 2026 blueprint, fully responsive (desktop + mobile), SEO copy from your pages, new AI visuals. Pick a template on webmorp.art or we choose from experience; examples are on the site.

Reply "yes" to queue.

Thanks,
Pavel
CEO, webmorp
webmorp.art"""


def _blocked(host: str) -> bool:
    h = host.lower()
    return any(b in h for b in _HOST_BLOCK_SUBSTR)


def export_md(
    out_path: Path,
    db_path: Path,
    limit: int = 50,
) -> tuple[int, int]:
    conn = sqlite3.connect(str(db_path))
    conn.row_factory = sqlite3.Row
    cur = conn.execute(
        """
        SELECT url, host, email, score, reasons, niche, id
        FROM leads
        WHERE email IS NOT NULL AND email != ''
        ORDER BY score DESC, id DESC
        """
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

    lines: list[str] = [
        "# Outreach batch 2 — автогенерация из leads.db",
        "",
        f"Сгенерировано из базы: `{db_path.name}`. В документе **{len(kept)}** лидов (макс. {limit}) после фильтра доменов. Проверь To и URL вручную перед отправкой.",
        "",
        "От кого: `customer@pixid.studio` · Pavel, CEO, webmorp · https://webmorp.art",
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
        subj = subject_problem(host)
        lines.append(f"## {i} — {host}")
        lines.append("")
        lines.append("| Поле | Значение |")
        lines.append("|------|----------|")
        lines.append(f"| To | {em} |")
        lines.append(f"| Subject | {subj} |")
        lines.append(f"| URL (лид) | {r['url']} |")
        lines.append(f"| Score | {r['score']} |")
        lines.append(f"| Niche (поиск) | {r.get('niche') or '—'} |")
        lines.append("")
        lines.append("Body:")
        lines.append("")
        lines.append(EMAIL_TEMPLATE.format(host=host))
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
    args = ap.parse_args()
    n, total = export_md(Path(args.out), Path(args.db), limit=args.limit)
    print(f"Exported {n} leads (email rows in DB before filter: {total}) → {args.out}")


if __name__ == "__main__":
    main()
