"""
Gemini: style choice, AIDA rewrite, single-page Tailwind HTML.
"""

from __future__ import annotations

import os
import re
from pathlib import Path
from typing import Any

import google.generativeai as genai

try:
    from dotenv import load_dotenv

    load_dotenv(Path(__file__).resolve().parent / ".env")
except ImportError:
    pass

# Default: best tier in Google AI Studio for coding + long outputs (see ai.google.dev/gemini-api/docs/models).
# Override: GEMINI_MODEL=gemini-2.5-pro (stable) if preview quotas or availability bite.
DEFAULT_MODEL = os.environ.get("GEMINI_MODEL", "gemini-3.1-pro-preview")


def _configure() -> None:
    key = os.environ.get("GOOGLE_API_KEY") or os.environ.get("GEMINI_API_KEY")
    if not key:
        raise RuntimeError(
            "Set GOOGLE_API_KEY or GEMINI_API_KEY for Gemini (designer + outreach)."
        )
    genai.configure(api_key=key)


SYSTEM_INSTRUCTION = """You are a senior landing-page designer and copywriter for WebMorp.art.
You output ONE complete HTML document only — no markdown fences, no explanation before or after.
Use Tailwind CSS via CDN: <script src="https://cdn.tailwindcss.com"></script>
The page must be self-contained, responsive, and professional.
Use placeholder images: prefer https://images.unsplash.com/ with query parameters matching the niche,
or data URI placeholders only if necessary. Include meaningful alt text.
Pick exactly one visual style from: Minimalist, Corporate, Modern, Vibrant — and reflect it in layout and typography."""


def build_design_prompt(scrape_json: dict[str, Any]) -> str:
    return f"""Based on this scraped website data (JSON), produce a redesigned single-page marketing site.

SCRAPED DATA:
{scrape_json}

REQUIREMENTS:
1. Infer the business niche and choose the best style: Minimalist | Corporate | Modern | Vibrant.
2. Rewrite copy using AIDA (Attention, Interest, Desire, Action). Short, punchy, trustworthy.
3. Generate complete HTML5 with Tailwind (CDN). Single file, no external CSS files.
4. Include: hero, value props, services/products section, social proof placeholder, strong CTA, footer with contact hint.
5. Use Unsplash URLs with relevant keywords for hero and one section image.

OUTPUT: Raw HTML only, starting with <!DOCTYPE html>."""


def generate_html(scrape_json: dict[str, Any], model: str | None = None) -> str:
    _configure()
    m = model or DEFAULT_MODEL
    model_obj = genai.GenerativeModel(m, system_instruction=SYSTEM_INSTRUCTION)
    prompt = build_design_prompt(scrape_json)
    resp = model_obj.generate_content(prompt)
    text = (resp.text or "").strip()
    # Strip accidental markdown fences
    text = re.sub(r"^```(?:html)?\s*", "", text)
    text = re.sub(r"\s*```\s*$", "", text)
    return text.strip()


def save_index_html(html: str, path: str) -> None:
    with open(path, "w", encoding="utf-8") as f:
        f.write(html)
