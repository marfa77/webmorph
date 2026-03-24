"""
Поиск потенциальных лидов: «живые», но устаревшие / примитивные сайты.

Поиск — DuckDuckGo (без API ключа). Для продакшена лучше Google Custom Search (CSE).
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import time
from pathlib import Path
from dataclasses import asdict, dataclass
from typing import Any
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup
try:
    from ddgs import DDGS
except ImportError:
    from duckduckgo_search import DDGS  # pragma: no cover

from scraper import USER_AGENT

try:
    from scraper import _session
except Exception:  # pragma: no cover
    _session = None

# Не тратим время на агрегаторы, каталоги и соцсети
_SKIP_HOST_SUBSTR = (
    "facebook.com",
    "instagram.com",
    "linkedin.com",
    "twitter.com",
    "x.com",
    "youtube.com",
    "google.com",
    "maps.google",
    "goo.gl",
    "yelp.com",
    "tripadvisor",
    "wikipedia.org",
    "amazon.",
    "ebay.",
    "github.com",
    "medium.com",
    "pinterest.com",
    "tiktok.com",
    "yellowpages",
    "superpages.com",
    "bbb.org",
    "manta.com",
    "chamberofcommerce",
    "bizapedia",
    "findlaw.com",
    "lawyers.com",
    "avvo.com",
    "elisting.",
    "listing.com",
    "listoflocal",
    "localusabizlisting",
    "usalocallisting",
    "thumbtack.com",
    "angi.com",
    "homeadvisor",
    "houzz.com",
    "nypost.com",
    "nytimes.com",
    "cnn.com",
    "bbc.co.uk",
    "bbc.com",
    "washingtonpost.com",
    "foxnews.com",
    "forbes.com",
    "metro.co.uk",
    "yourdictionary.com",
    "businessdirectory",
    "dictionary.com",
    "thefreedictionary",
    "explorepartsunknown",
    "frontier.com",
    "nybizdb.com",
    "bizdb.com",
    "bestwebdesignstudio",
    "dailyinvestnews",
    "investnews",
)


def _fetch(url: str, timeout: int = 14) -> tuple[str | None, dict[str, Any]]:
    try:
        s = _session() if _session else requests.Session()
        if not _session:
            s.headers.update({"User-Agent": USER_AGENT})
        r = s.get(
            url,
            timeout=timeout,
            allow_redirects=True,
            headers={"User-Agent": USER_AGENT},
        )
        return r.text, {"status": r.status_code, "final_url": str(r.url)}
    except Exception as e:
        return None, {"error": str(e)}


def _host_ok(url: str) -> bool:
    try:
        host = urlparse(url).netloc.lower()
        if host.startswith("www."):
            host = host[4:]
    except Exception:
        return False
    if any(x in host for x in _SKIP_HOST_SUBSTR):
        return False
    path = urlparse(url).path.lower()
    if any(
        x in path
        for x in (
            "/category/",
            "/tag/",
            "/list/",
            "/search",
            "/directory",
            "/business-directory",
            "/companies",
        )
    ):
        return False
    if host.endswith(".gov") or host.endswith(".gov.uk") or host.endswith(".mil"):
        return False
    if host.endswith(".edu") or ".sc.edu" in host or ".cic.sc.edu" in host:
        return False
    # Типичный URL новостной статьи, не визитка
    if re.search(r"/\d{4}/\d{2}/", path):
        return False
    if "/blog/" in path or path.rstrip("/").endswith("/blog"):
        return False
    return True


def _email_matches_site(url: str, email: str) -> bool:
    """Email на том же домене, что и сайт (не чужой баннер/реклама)."""
    if "@" not in email:
        return False
    edom = email.split("@", 1)[1].lower().strip()
    try:
        host = urlparse(url).netloc.lower()
    except Exception:
        return False
    if host.startswith("www."):
        host = host[4:]
    if edom == host:
        return True
    if len(host.split(".")) >= 2 and len(edom.split(".")) >= 2:
        if host.split(".")[-2:] == edom.split(".")[-2:]:
            return True
    return False


def _pick_email_for_site(url: str, emails: list[str]) -> str:
    for e in emails:
        if _email_matches_site(url, e):
            return e
    return ""


def _region_tld(region: str) -> str:
    r = region.lower()
    if any(x in r for x in ("dubai", "uae", "emirates", "abu dhabi", "sharjah")):
        return ".ae"
    if any(x in r for x in ("uk", "london", "england", "scotland")):
        return ".co.uk"
    if "portugal" in r or "lisbon" in r:
        return ".pt"
    if "australia" in r or "sydney" in r or "melbourne" in r:
        return ".com.au"
    return ""


# По умолчанию ищем сразу по нескольким англоязычным рынкам (без привязки только к Дубаю).
ENGLISH_MARKETS: tuple[str, ...] = (
    "USA",
    "Dubai",
    "UK",
    "Australia",
    "Canada",
    "New Zealand",
    "Ireland",
)


def build_search_queries(
    niche: str,
    region: str = "",
    *,
    single_region: bool = False,
) -> list[str]:
    """
    single_region=False (по умолчанию): запросы по ниши для USA, Dubai, UK, AU, CA, …
    single_region=True + region: старый режим — один географический хвост и site: TLD при возможности.
    """
    niche = niche.strip()
    if not niche:
        return []

    if single_region and region.strip():
        r = region.strip()
        base = f"{niche} {r}".strip()
        tld = _region_tld(r)
        queries = [
            f'{base} contact',
            f'{base} "powered by WordPress"',
            f'{base} © 2018',
            f'{base} © 2019',
            f'{base} small business',
            f'{base} wordpress theme',
        ]
        if tld:
            queries.append(f"site:{tld.lstrip('.')} {niche}")
        return list(dict.fromkeys(queries))

    queries: list[str] = []
    for m in ENGLISH_MARKETS:
        queries.append(f"{niche} {m} contact")
        queries.append(f'{niche} {m} "powered by WordPress"')
        queries.append(f"{niche} {m} small business")
    queries.append(f'{niche} "powered by WordPress"')
    queries.append(f"{niche} professional services © 2018")
    queries.append(f"{niche} family owned contact email")
    queries.append(f"{niche} licensed contractor @")
    return list(dict.fromkeys(queries))


def _score_page(html: str | None, meta: dict[str, Any]) -> tuple[int, list[str]]:
    if not html:
        return 0, ["unreachable"]
    reasons: list[str] = []
    score = 3
    soup = BeautifulSoup(html, "html.parser")
    low = html.lower()
    text_len = len(soup.get_text(separator=" ", strip=True))

    if not soup.find("meta", attrs={"name": "viewport"}):
        score += 3
        reasons.append("No viewport (типично не мобильный)")

    gen = soup.find("meta", attrs={"name": "generator"})
    if gen and "wordpress" in (gen.get("content") or "").lower():
        score += 1
        reasons.append("WordPress (generator)")

    for y in range(2008, 2021):
        if f"© {y}" in html or f"&copy; {y}" in low or f"copyright {y}" in low:
            score += 2
            reasons.append(f"Старый copyright ({y})")
            break

    if "jquery/1." in low or "jquery-1." in low:
        score += 1
        reasons.append("jQuery 1.x")

    if "/wp-json/" in low or "wp-content" in low:
        score += 1
        reasons.append("WP paths")

    if soup.find_all("table") and len(soup.find_all("table")) >= 6:
        score += 1
        reasons.append("Много <table> (возможная вёрстка таблицами)")

    if soup.find_all(["font", "center"]) or "<marquee" in low:
        score += 1
        reasons.append("Устаревшие теги (font/center/marquee)")

    if text_len < 400:
        score += 1
        reasons.append("Мало текста на главной")

    if not soup.find("link", rel=lambda x: x and "icon" in x.lower() if x else False):
        if not soup.find("link", attrs={"rel": "shortcut icon"}):
            score += 1
            reasons.append("Нет favicon в разметке")

    if meta.get("status") and int(meta["status"]) >= 400:
        score = min(score, 2)
        reasons.append(f"HTTP {meta['status']}")

    return min(score, 10), reasons


def _emails_from_html(html: str) -> list[str]:
    return list(
        dict.fromkeys(
            re.findall(
                r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}",
                html,
            )
        )
    )[:5]


def _find_contact_url(soup: BeautifulSoup, base: str) -> str | None:
    for a in soup.find_all("a", href=True):
        t = (a.get_text() or "").strip().lower()
        h = a["href"].lower()
        if any(k in t or k in h for k in ("contact", "about", "reach-us", "get-in-touch")):
            return urljoin(base, a["href"])
    return None


def _first_phone_candidate(html: str) -> str:
    """Не подставляем в контакт случайные ID/дроби со страницы."""
    for m in re.finditer(r"\+?\d[\d\s\-().]{8,}\d", html):
        s = m.group().strip()
        compact = re.sub(r"\s", "", s)
        if re.fullmatch(r"\d+\.\d+", compact):
            continue
        digits = re.sub(r"\D", "", s)
        if len(digits) < 10 or len(digits) > 15:
            continue
        return s
    return ""


def _enrich_contact(seed_url: str) -> tuple[list[str], str | None]:
    html, meta = _fetch(seed_url)
    if not html:
        return [], None
    soup = BeautifulSoup(html, "html.parser")
    base = meta.get("final_url") or seed_url
    emails = _emails_from_html(html)
    extra = _find_contact_url(soup, base)
    if extra and extra.rstrip("/") != seed_url.rstrip("/"):
        time.sleep(0.3)
        h2, _ = _fetch(extra)
        if h2:
            emails.extend(_emails_from_html(h2))
    return list(dict.fromkeys(emails))[:5], extra


@dataclass
class LeadRow:
    url: str
    score: int
    email_or_phone: str
    reasons: str

    def line(self) -> str:
        return f"{self.score}/10 | {self.url} | {self.email_or_phone} | {self.reasons}"


def _ddg_collect(queries: list[str], per_query: int) -> list[str]:
    urls: list[str] = []
    seen: set[str] = set()
    with DDGS() as ddgs:
        for q in queries:
            try:
                for item in ddgs.text(q, max_results=per_query):
                    u = item.get("href") or item.get("url")
                    if not u or not u.startswith("http"):
                        continue
                    u = u.split("#")[0].rstrip("/")
                    if u in seen or not _host_ok(u):
                        continue
                    seen.add(u)
                    urls.append(u)
            except Exception:
                continue
            time.sleep(0.5)
    return urls


def search_leads(
    niche: str,
    region: str,
    *,
    per_query: int = 8,
    min_score: int = 5,
    delay_s: float = 0.4,
    require_email: bool = False,
    limit: int | None = None,
    single_region: bool = False,
) -> list[LeadRow]:
    queries = build_search_queries(niche, region, single_region=single_region)
    urls = _ddg_collect(queries, per_query)
    rows: list[LeadRow] = []
    seen_hosts: set[str] = set()

    for url in urls:
        try:
            host = urlparse(url).netloc.lower()
            if host.startswith("www."):
                host = host[4:]
            if host in seen_hosts:
                continue
            seen_hosts.add(host)
        except Exception:
            continue

        time.sleep(delay_s)
        html, meta = _fetch(url)
        score, reasons = _score_page(html, meta)
        if score < min_score:
            continue

        emails, _ = _enrich_contact(url) if html else ([], None)
        contact = _pick_email_for_site(url, emails) if emails else ""
        if not contact and emails:
            contact = emails[0]
        if not contact and html:
            contact = _first_phone_candidate(html) or "—"
        if not contact:
            contact = "—"

        if require_email:
            if "@" not in contact or not _email_matches_site(url, contact):
                continue

        rows.append(
            LeadRow(
                url=url,
                score=score,
                email_or_phone=contact or "—",
                reasons="; ".join(reasons) if reasons else "ok",
            )
        )
        if limit is not None and len(rows) >= limit:
            break

    rows.sort(key=lambda r: (-r.score, r.url))
    return rows


def main(argv: list[str] | None = None) -> None:
    argv = argv if argv is not None else sys.argv[1:]
    ap = argparse.ArgumentParser(
        description="Поиск примитивных / устаревших сайтов для WebMorp.art",
    )
    ap.add_argument(
        "niche",
        nargs="+",
        metavar="WORD",
        help="Ниша (напр. dentist, house cleaning). Регион по умолчанию не нужен — ищем USA, Dubai, UK, AU, CA, …",
    )
    ap.add_argument(
        "--region",
        metavar="PLACE",
        help="Сузить до одного региона (напр. Dubai, Texas, UK). Без флага — несколько англоязычных рынков.",
    )
    ap.add_argument(
        "--min-score",
        type=int,
        default=5,
        help="Минимальный балл «плохости» 1–10 (по умолчанию 5)",
    )
    ap.add_argument(
        "--per-query",
        type=int,
        default=8,
        help="Сколько результатов на каждый подзапрос DDG",
    )
    ap.add_argument(
        "--out",
        "-o",
        metavar="FILE",
        help="Сохранить JSON (url, score, contact, reasons)",
    )
    ap.add_argument(
        "--dry-search",
        action="store_true",
        help="Только показать сгенерированные поисковые запросы и выйти",
    )
    ap.add_argument(
        "--require-email",
        action="store_true",
        help="Только лиды, где на странице найден email (не телефон)",
    )
    ap.add_argument(
        "--limit",
        type=int,
        default=None,
        metavar="N",
        help="Остановиться после N подходящих результатов",
    )
    ap.add_argument(
        "--db",
        metavar="PATH",
        nargs="?",
        const="leads.db",
        default=None,
        help="Записать лиды в SQLite (путь к .db; по умолчанию pipeline/leads.db)",
    )
    args = ap.parse_args(argv)

    niche = " ".join(args.niche).strip()
    if not niche:
        ap.print_help()
        sys.exit(1)

    region = (args.region or "").strip()
    single_region = bool(region)

    queries = build_search_queries(niche, region, single_region=single_region)
    if args.dry_search:
        for i, sq in enumerate(queries, 1):
            print(f"{i}. {sq}")
        return

    scope = f"регион: {region}" if single_region else f"рынки: {', '.join(ENGLISH_MARKETS)}"
    print(
        f"Запросы: {len(queries)} DDG | {scope} | min_score≥{args.min_score}"
        f"{' | только email' if args.require_email else ''}"
        f"{f' | limit {args.limit}' if args.limit else ''}\n",
        file=sys.stderr,
    )
    rows = search_leads(
        niche,
        region,
        per_query=args.per_query,
        min_score=args.min_score,
        require_email=args.require_email,
        limit=args.limit,
        single_region=single_region,
    )
    for r in rows:
        print(r.line())
    if args.out:
        Path(args.out).write_text(
            json.dumps([asdict(r) for r in rows], indent=2, ensure_ascii=False),
            encoding="utf-8",
        )
        print(f"\nSaved {len(rows)} rows → {args.out}", file=sys.stderr)

    if args.db is not None:
        base = Path(__file__).resolve().parent
        p = Path(args.db)
        db_path = p if p.is_absolute() else (base / p)
        try:
            from leads_db import save_rows_from_finder

            n = save_rows_from_finder(rows, niche=niche, path=db_path)
            print(f"DB: записано {n} строк → {db_path}", file=sys.stderr)
        except Exception as e:
            print(f"DB error: {e}", file=sys.stderr)
            sys.exit(1)


if __name__ == "__main__":
    main()
