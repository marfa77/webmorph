"""
Render local index.html with Playwright and capture a full-page PNG.
"""

from __future__ import annotations

import os
from pathlib import Path

from playwright.sync_api import sync_playwright

DEFAULT_VIEWPORT = {"width": 1280, "height": 800}


def screenshot_html(
    html_path: str | os.PathLike[str],
    output_png: str | os.PathLike[str],
    wait_ms: int = 1500,
) -> Path:
    """
    Open file:// HTML, wait for network idle / styles, full-page screenshot.
    """
    html_abs = Path(html_path).resolve()
    if not html_abs.is_file():
        raise FileNotFoundError(html_abs)
    out = Path(output_png).resolve()
    out.parent.mkdir(parents=True, exist_ok=True)
    uri = html_abs.as_uri()

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        try:
            page = browser.new_page(viewport=DEFAULT_VIEWPORT)
            page.goto(uri, wait_until="networkidle", timeout=60_000)
            page.wait_for_timeout(wait_ms)
            page.screenshot(path=str(out), full_page=True)
        finally:
            browser.close()
    return out
