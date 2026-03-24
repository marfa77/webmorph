"""
Gemini-generated first-touch outreach email from scrape context.
"""

from __future__ import annotations

import os
from typing import Any

import google.generativeai as genai

from designer import DEFAULT_MODEL, _configure


def build_outreach_prompt(scrape_json: dict[str, Any], site_name: str | None = None) -> str:
    name = site_name or scrape_json.get("page_title") or "your business"
    return f"""You are writing a short, respectful cold email (English) from an independent web designer
offering a free concept screenshot for a redesigned one-page site (WebMorp.art style, $100 flat positioning optional).

SCRAPED SITE DATA:
{scrape_json}

RULES:
- Tone: professional, specific, not spammy. 120–180 words max.
- Mention that their site (refer to "{name}" or the URL) feels dated or hurts trust — ground it in ONE observable detail from the data if possible (e.g. no mobile viewport, old-style copy).
- Offer: "I've already sketched how an updated version could look — want a free concept screenshot?"
- Single subject line + email body. No HTML.

Format exactly:
SUBJECT: ...
BODY:
..."""


def generate_outreach_email(
    scrape_json: dict[str, Any],
    site_name: str | None = None,
    model: str | None = None,
) -> str:
    _configure()
    m = model or DEFAULT_MODEL
    model_obj = genai.GenerativeModel(m)
    prompt = build_outreach_prompt(scrape_json, site_name=site_name)
    resp = model_obj.generate_content(prompt)
    return (resp.text or "").strip()
