"""
WebMorp.art CLI — manual pipeline: analyze → (send mail) → render → ship.
"""

from __future__ import annotations

import argparse
import json
import os
import zipfile
from pathlib import Path

from designer import generate_html, save_index_html
from outreach import generate_outreach_email
from scraper import load_json_dict
from visualizer import screenshot_html

WORKDIR = Path(os.environ.get("WEBMORP_WORKDIR", ".webmorp_run"))
INDEX = WORKDIR / "index.html"
PREVIEW = WORKDIR / "preview.png"
SCRAPE_JSON = WORKDIR / "scrape.json"


def cmd_analyze(url: str) -> None:
    WORKDIR.mkdir(parents=True, exist_ok=True)
    data = load_json_dict(url)
    SCRAPE_JSON.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
    print("--- Scrape saved to", SCRAPE_JSON)
    email = generate_outreach_email(data, site_name=data.get("page_title"))
    print("\n--- Outreach draft ---\n")
    print(email)
    print("\n--- End ---\n")


def cmd_render() -> None:
    if not SCRAPE_JSON.is_file():
        raise SystemExit(f"Missing {SCRAPE_JSON}. Run `analyze` first.")
    data = json.loads(SCRAPE_JSON.read_text(encoding="utf-8"))
    html = generate_html(data)
    save_index_html(html, str(INDEX))
    print("Wrote", INDEX)
    path = screenshot_html(INDEX, PREVIEW)
    print("Screenshot:", path)


def cmd_ship(
    payment_url: str | None,
    crypto_hint: str | None,
) -> None:
    if not INDEX.is_file():
        raise SystemExit("Nothing to ship — run `render` first.")
    zip_path = WORKDIR / "webmorp_delivery.zip"
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as z:
        z.write(INDEX, arcname="index.html")
        if PREVIEW.is_file():
            z.write(PREVIEW, arcname="preview.png")
        if SCRAPE_JSON.is_file():
            z.write(SCRAPE_JSON, arcname="scrape.json")
    print("Archive ready:", zip_path.resolve())
    if payment_url:
        print("Pay here:", payment_url)
    if crypto_hint:
        print("Crypto:", crypto_hint)


def main() -> None:
    p = argparse.ArgumentParser(description="WebMorp.art operator CLI")
    sub = p.add_subparsers(dest="cmd", required=True)

    a = sub.add_parser("analyze", help="Scrape URL + print outreach draft")
    a.add_argument("url")

    sub.add_parser("render", help="Gemini HTML + Playwright screenshot")

    s = sub.add_parser("ship", help="Zip delivery + payment hints")
    s.add_argument("--payment-url", default=os.environ.get("WEBMORP_PAYMENT_URL"))
    s.add_argument("--crypto", default=os.environ.get("WEBMORP_CRYPTO_ADDRESS"))

    f = sub.add_parser("finder", help="Delegate to finder.py (lead search)")
    f.add_argument("query", nargs=argparse.REMAINDER)

    args = p.parse_args()
    if args.cmd == "analyze":
        cmd_analyze(args.url)
    elif args.cmd == "render":
        cmd_render()
    elif args.cmd == "ship":
        cmd_ship(args.payment_url, args.crypto)
    elif args.cmd == "finder":
        import finder

        finder.main(args.query or [])


if __name__ == "__main__":
    main()
