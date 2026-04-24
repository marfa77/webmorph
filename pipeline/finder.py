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

from scraper import USER_AGENT


def _ddgs_class():  # lazy: refilter_leads и др. могут импортировать finder без ddgs
    try:
        from ddgs import DDGS

        return DDGS
    except ImportError:
        from duckduckgo_search import DDGS  # pragma: no cover

        return DDGS

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
    "bing.com",
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


def _looks_like_non_static_brochure(html: str | None) -> bool:
    """
    Оставляем только простые статические визитки (чистый HTML/CSS, без CMS/БД/магазинов).

    Отсекаем: e-commerce, типовые CMS, конструкторы сайтов, признаки SSR/React/Vue/Nuxt/Next
    и прочие «движки». Не пытаемся ловить каждый скрипт (GA и т.д. — норма).
    """
    if not html:
        return False
    low = html.lower()

    # --- Интернет-магазины и checkout ---
    ecommerce: tuple[str, ...] = (
        "turbify",
        "store.turbify",
        "yhst-",
        "wg-order",
        "shopify.com",
        "shopifycdn.net",
        "myshopify.com",
        "woocommerce",
        "wc-ajax",
        "wp-json/wc/",
        "wc-cart",
        "class=\"woocommerce",
        "bigcommerce",
        "bigcommerce.com",
        "magento",
        "mage/cookies",
        "snipcart",
        "ecwid.com",
        "ecwid_script",
        "wixstores",
        "wixstores.com",
        "square.site",
        "squareup.com/checkout",
        "paypal.com/cgi-bin/webscr",
        "cmd=_cart",
        "stripe.com/checkout",
        "buy-button-container",
        "add to cart",
        "add-to-cart",
        "addtocart",
        "add_to_cart",
        "shopping cart",
        "view cart",
        "your cart",
        "minicart",
        "cart-items",
        "/shopping-cart",
        "/shopping_cart",
        "checkout.aspx",
        "/checkout?",
        'href="/cart',
        "href='/cart",
        "/cart.php",
        "/cart.htm",
        "/basket",
        "prestashop",
        "opencart",
        "fastspring",
        "gumroad.com",
        "lemon squeezy",
        "lemonsqueezy",
        "amazon-associates",
        "ebay.com/itm",
        "etsy.com/listing",
    )

    # --- CMS, БД-сайты, конструкторы ---
    cms_and_builders: tuple[str, ...] = (
        # WordPress
        "/wp-content/",
        "/wp-includes/",
        "wp-json/",
        "xmlrpc.php",
        "/wp-login.php",
        "wp-embed.min.js",
        'content="wordpress',
        "wp-emoji-release",
        # Drupal / Joomla / TYPO3
        "drupal.js",
        "drupalsettings",
        "/sites/default/files/",
        'content="drupal',
        "option=com_content",
        "?option=com_",
        "&option=com_",
        "/media/system/js/joomla",
        "typo3temp",
        "typo3conf",
        # Ghost / Craft / SilverStripe / Concrete …
        'content="ghost',
        "ghost.io/",
        "craftcms",
        "/craft/",
        "concrete5",
        "silverstripe",
        "expressionengine",
        # Конструкторы
        "wixstatic.com",
        "static.parastorage.com",
        ".wix.com/",
        "wixpress.com",
        "editorx.com",
        "squarespace.com",
        "squarespace-cdn",
        "static1.squarespace",
        "webflow.io",
        "webflow.com",
        "data-wf-domain",
        "assets.website-files.com",
        "weebly.com",
        "weeblycloud.com",
        "multiscreensite.com",
        "duda.co",
        "leadpages.net",
        "unbounce.com",
        "landingi.com",
        "instapage.com",
        "clickfunnels.com",
        "kartra.com",
        # HubSpot / маркетинговые CMS
        "hs-scripts.com",
        "hubspotusercontent",
        "hsforms.net",
        "hs-sites.com",
        # GoDaddy Website Builder
        "wsimg.com",
        # SharePoint / enterprise
        "sharepoint.com",
        "/_layouts/",
        # Adobe Experience Manager
        "/etc.clientlibs/",
        # Форумы / LMS (не визитки)
        "phpbb",
        "vbulletin",
        "discourse-cdn",
        "flarum",
        "moodle",
        # Blogger
        "blogblog.com",
        "blogger.com/static",
    )

    # --- SPA / SSR / app-оболочки (не «простой статик») ---
    spa_ssr: tuple[str, ...] = (
        "__next_data__",
        "__next_f",
        "/_next/static/",
        "/_next/data/",
        "__nuxt",
        "/_nuxt/",
        "___gatsby",
        "gatsby-js",
        "data-reactroot",
        "data-react-helmet",
        "sveltekit",
        "__sveltekit",
        "@remix-run",
        "ember-cli",
        "angular-cli",
    )

    all_markers = ecommerce + cms_and_builders + spa_ssr
    return any(m in low for m in all_markers)


def _looks_like_ecommerce(html: str | None) -> bool:
    """Совместимость: раньше только магазины; логика вошла в _looks_like_non_static_brochure."""
    return _looks_like_non_static_brochure(html)


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

# Явный lang / content-language начинается с одного из этих — считаем не английским.
_NON_EN_LANG_PREFIXES: tuple[str, ...] = (
    "es",
    "fr",
    "de",
    "it",
    "pt",
    "nl",
    "pl",
    "ru",
    "ja",
    "zh",
    "ko",
    "ar",
    "hi",
    "tr",
    "sv",
    "da",
    "no",
    "nb",
    "fi",
    "cs",
    "el",
    "he",
    "th",
    "vi",
    "id",
    "ms",
    "ro",
    "hu",
    "bg",
    "sk",
    "uk",
    "fa",
)


def _lang_tag_is_non_english(lang: str) -> bool:
    lang = lang.strip().lower().replace("_", "-")
    if not lang:
        return False
    if lang.startswith("en"):
        return False
    base = lang.split("-", 1)[0]
    return base in _NON_EN_LANG_PREFIXES or any(
        lang == p or lang.startswith(f"{p}-") for p in _NON_EN_LANG_PREFIXES
    )


def _page_likely_english(html: str | None) -> bool:
    """
    Эвристика: html lang / meta content-language + доля кириллицы/CJK в тексте.
    Нет lang — допускаем (много старых сайтов), но режем явный не-английский.
    """
    if not html:
        return False
    soup = BeautifulSoup(html, "html.parser")
    html_el = soup.find("html")
    if html_el and html_el.get("lang"):
        if _lang_tag_is_non_english(html_el["lang"]):
            return False
    for meta in soup.find_all("meta"):
        if (meta.get("http-equiv") or "").lower() != "content-language":
            continue
        raw = (meta.get("content") or "").lower().split(",")[0].strip().split(";")[0]
        if raw and _lang_tag_is_non_english(raw):
            return False
    text = soup.get_text(separator=" ", strip=True)[:5000]
    if len(text) > 100:
        cyr = len(re.findall(r"[\u0400-\u04FF]", text))
        if cyr / len(text) > 0.12:
            return False
        cjk = len(re.findall(r"[\u3040-\u30ff\u4e00-\u9fff\uac00-\ud7af]", text))
        if cjk / len(text) > 0.12:
            return False
    return True


def build_search_queries(
    niche: str,
    region: str = "",
    *,
    single_region: bool = False,
    global_english: bool = False,
    lite_global: bool = False,
) -> list[str]:
    """
    single_region=False (по умолчанию): запросы по ниши для USA, Dubai, UK, AU, CA, …
    single_region=True + region: старый режим — один географический хвост и site: TLD при возможности.
    global_english=True: без привязки к стране — нейтральные англоязычные запросы (сайт фильтруем по языку).
    """
    niche = niche.strip()
    if not niche:
        return []

    if global_english:
        full = [
            f"{niche} contact email",
            f"{niche} contact us",
            f'{niche} "powered by WordPress"',
            f"{niche} website © 2018",
            f"{niche} website © 2019",
            f"{niche} small business website",
            f"{niche} professional services",
            f"{niche} get a quote",
            f"{niche} book online",
            f"{niche} licensed insured",
            f'"{niche}" @gmail.com',
            f"{niche} ltd contact",
        ]
        lite = [
            f"{niche} contact email",
            f"{niche} contact us",
            f'{niche} "powered by WordPress"',
            f"{niche} small business website",
            f"{niche} professional services",
        ]
        queries = lite if lite_global else full
        return list(dict.fromkeys(queries))

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
    DDGS = _ddgs_class()
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
    global_english: bool = False,
    skip_engine_filter: bool = False,
    lite_global_queries: bool = False,
    max_url_checks: int | None = None,
    allow_any_page_email: bool = False,
) -> list[LeadRow]:
    queries = build_search_queries(
        niche,
        region,
        single_region=single_region,
        global_english=global_english,
        lite_global=lite_global_queries and global_english,
    )
    urls = _ddg_collect(queries, per_query)
    rows: list[LeadRow] = []
    seen_hosts: set[str] = set()
    url_checks = 0

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

        if max_url_checks is not None and url_checks >= max_url_checks:
            break
        url_checks += 1

        time.sleep(delay_s)
        html, meta = _fetch(url)
        if html and global_english and not _page_likely_english(html):
            continue
        if html and not skip_engine_filter and _looks_like_non_static_brochure(html):
            continue
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
            if "@" not in contact:
                continue
            if not allow_any_page_email and not _email_matches_site(url, contact):
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
        help="Ниша (напр. dentist, house cleaning). Без --global-english: рынки USA, UK, AU, … С флагом — любая география, страница на англ.",
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
        "--allow-any-email",
        action="store_true",
        help="С --require-email: принять любой email со страницы (не только @домен-сайта); больше лидов, часть ящиков чужие/общие",
    )
    ap.add_argument(
        "--limit",
        type=int,
        default=None,
        metavar="N",
        help="Остановиться после N подходящих результатов",
    )
    ap.add_argument(
        "--global-english",
        action="store_true",
        help="Поиск без привязки к стране; отсекаем сайты с явным не-англ. lang и сильной кириллицей/CJK в тексте",
    )
    ap.add_argument(
        "--skip-engine-filter",
        action="store_true",
        help="Не отсекать WP/Wix/магазины/SPA (как refilter_leads --skip-engine-filter): больше лидов, не только «чистый статик»",
    )
    ap.add_argument(
        "--max-url-checks",
        type=int,
        default=0,
        metavar="N",
        help="Макс. уникальных хостов проверить за запуск (0 = без лимита; collect_leads задаёт свой дефолт)",
    )
    ap.add_argument(
        "--lite-global-queries",
        action="store_true",
        help="С --global-english: только 5 DDG-запросов вместо 12 (быстрее)",
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

    queries = build_search_queries(
        niche,
        region,
        single_region=single_region,
        global_english=args.global_english,
        lite_global=args.lite_global_queries,
    )
    if args.dry_search:
        for i, sq in enumerate(queries, 1):
            print(f"{i}. {sq}")
        return

    if args.allow_any_email and not args.require_email:
        print(
            "Предупреждение: --allow-any-email имеет смысл только с --require-email",
            file=sys.stderr,
        )

    if args.global_english:
        scope = "глобально, страница на англ. (эвристика lang + текст)"
    else:
        scope = f"регион: {region}" if single_region else f"рынки: {', '.join(ENGLISH_MARKETS)}"
    print(
        f"Запросы: {len(queries)} DDG | {scope} | min_score≥{args.min_score}"
        f"{' | только email' if args.require_email else ''}"
        f"{' | any-email' if args.require_email and args.allow_any_email else ''}"
        f"{f' | limit {args.limit}' if args.limit else ''}\n",
        file=sys.stderr,
    )
    max_uc = args.max_url_checks if args.max_url_checks > 0 else None
    rows = search_leads(
        niche,
        region,
        per_query=args.per_query,
        min_score=args.min_score,
        require_email=args.require_email,
        limit=args.limit,
        single_region=single_region,
        global_english=args.global_english,
        skip_engine_filter=args.skip_engine_filter,
        lite_global_queries=args.lite_global_queries,
        max_url_checks=max_uc,
        allow_any_page_email=args.allow_any_email,
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
