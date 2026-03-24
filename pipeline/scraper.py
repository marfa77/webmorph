"""
Extract structured meaning from a target site's main page (+ light crawl for contact hints).
"""

from __future__ import annotations

import json
import re
from dataclasses import dataclass, field
from typing import Any
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup

DEFAULT_TIMEOUT = 20
USER_AGENT = (
    "Mozilla/5.0 (compatible; WebMorpBot/1.0; +https://webmorp.art) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)


@dataclass
class ScrapeResult:
    url: str
    title: str
    h1: str
    headings: list[str]
    service_texts: list[str]
    contacts: dict[str, Any]
    logo_url: str | None
    color_hints: list[str]
    meta: dict[str, Any] = field(default_factory=dict)

    def to_json_dict(self) -> dict[str, Any]:
        return {
            "url": self.url,
            "page_title": self.title,
            "h1": self.h1,
            "headings": self.headings,
            "service_or_product_texts": self.service_texts,
            "contacts": self.contacts,
            "logo_url": self.logo_url,
            "color_hints": self.color_hints,
            "meta": self.meta,
        }


def _session() -> requests.Session:
    s = requests.Session()
    s.headers.update({"User-Agent": USER_AGENT, "Accept-Language": "en-US,en;q=0.9"})
    return s


def _extract_colors(html: str) -> list[str]:
    # Hex colors in inline styles and stylesheets (rough)
    hexes = re.findall(r"#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})\b", html)
    uniq: list[str] = []
    for h in hexes:
        full = f"#{h}" if h.startswith("#") else f"#{h}"
        if full not in uniq:
            uniq.append(full)
        if len(uniq) >= 12:
            break
    return uniq


def _find_logo(soup: BeautifulSoup, base_url: str) -> str | None:
    for sel in [
        'link[rel="icon"]',
        'link[rel="shortcut icon"]',
        'link[rel="apple-touch-icon"]',
        'meta[property="og:image"]',
    ]:
        tag = soup.select_one(sel)
        if tag:
            href = tag.get("href") or tag.get("content")
            if href:
                return urljoin(base_url, href)
    img = soup.select_one('img[class*="logo" i], img[alt*="logo" i], header img')
    if img and img.get("src"):
        return urljoin(base_url, img["src"])
    return None


def _collect_service_texts(soup: BeautifulSoup) -> list[str]:
    chunks: list[str] = []
    for tag in soup.select("main p, article p, section p, .service p, #services p"):
        t = tag.get_text(" ", strip=True)
        if 40 < len(t) < 800:
            chunks.append(t)
    if not chunks:
        for p in soup.find_all("p"):
            t = p.get_text(" ", strip=True)
            if 60 < len(t) < 1200:
                chunks.append(t)
    return chunks[:12]


def _extract_contacts(soup: BeautifulSoup, base_url: str) -> dict[str, Any]:
    text = soup.get_text("\n", strip=True)
    emails = list(
        dict.fromkeys(
            re.findall(
                r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}",
                text,
            )
        )
    )
    phones = list(
        dict.fromkeys(
            re.findall(r"\+?\d[\d\s\-().]{8,}\d", text)[:5]
        )
    )
    social: dict[str, str] = {}
    for a in soup.select('a[href*="linkedin.com"], a[href*="twitter.com"], a[href*="x.com"]'):
        href = a.get("href") or ""
        if "linkedin" in href:
            social["linkedin"] = href
        elif "twitter" in href or "x.com" in href:
            social["twitter"] = href

    contact_links: list[str] = []
    for a in soup.find_all("a", href=True):
        h = (a.get("href") or "").lower()
        lab = (a.get_text() or "").lower()
        if any(
            x in h or x in lab
            for x in ("contact", "about", "reach", "get-in-touch")
        ):
            contact_links.append(urljoin(base_url, a["href"]))
    return {
        "emails": emails[:5],
        "phones": phones[:5],
        "social": social,
        "contact_page_candidates": list(dict.fromkeys(contact_links))[:5],
    }


def scrape_url(url: str, timeout: int = DEFAULT_TIMEOUT) -> ScrapeResult:
    """Fetch main page and return structured JSON-friendly data."""
    if not url.startswith(("http://", "https://")):
        url = "https://" + url
    sess = _session()
    r = sess.get(url, timeout=timeout)
    r.raise_for_status()
    final_url = str(r.url)
    soup = BeautifulSoup(r.text, "html.parser")

    title_tag = soup.title
    title = title_tag.get_text(strip=True) if title_tag else ""
    h1_el = soup.find("h1")
    h1 = h1_el.get_text(" ", strip=True) if h1_el else ""
    headings = [
        t.get_text(" ", strip=True)
        for t in soup.find_all(["h2", "h3"])[:20]
        if t.get_text(strip=True)
    ]

    viewport = soup.find("meta", attrs={"name": "viewport"})
    generator = soup.find("meta", attrs={"name": "generator"})

    result = ScrapeResult(
        url=final_url,
        title=title,
        h1=h1,
        headings=headings,
        service_texts=_collect_service_texts(soup),
        contacts=_extract_contacts(soup, final_url),
        logo_url=_find_logo(soup, final_url),
        color_hints=_extract_colors(r.text),
        meta={
            "has_viewport": viewport is not None,
            "generator": generator.get("content") if generator else None,
            "status_code": r.status_code,
        },
    )
    return result


def scrape_to_json(url: str) -> str:
    return json.dumps(scrape_url(url).to_json_dict(), indent=2, ensure_ascii=False)


def load_json_dict(url: str) -> dict[str, Any]:
    return scrape_url(url).to_json_dict()
