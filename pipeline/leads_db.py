"""
Локальная SQLite-база для лидов: URL сайта + email (и метаданные поиска).
Файл по умолчанию: leads.db рядом со скриптом (в каталоге pipeline/).
"""

from __future__ import annotations

import argparse
import json
import sqlite3
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

DEFAULT_DB_PATH = Path(__file__).resolve().parent / "leads.db"

SCHEMA = """
CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT NOT NULL UNIQUE,
    host TEXT NOT NULL,
    email TEXT,
    score INTEGER,
    reasons TEXT,
    niche TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_leads_host ON leads(host);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_niche ON leads(niche);
CREATE TABLE IF NOT EXISTS outreach_meta (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS outreach_sent (
    email TEXT PRIMARY KEY,
    lead_id INTEGER,
    sent_at TEXT NOT NULL,
    subject TEXT,
    source TEXT NOT NULL DEFAULT 'smtp',
    FOREIGN KEY (lead_id) REFERENCES leads(id)
);
CREATE INDEX IF NOT EXISTS idx_outreach_sent_at ON outreach_sent(sent_at);
"""


def _utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _host_from_url(url: str) -> str:
    try:
        h = urlparse(url).netloc.lower()
        if h.startswith("www."):
            return h[4:]
        return h
    except Exception:
        return ""


def connect(path: Path | str | None = None) -> sqlite3.Connection:
    p = Path(path) if path else DEFAULT_DB_PATH
    p.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(p))
    conn.row_factory = sqlite3.Row
    return conn


def init_db(path: Path | str | None = None) -> Path:
    p = Path(path) if path else DEFAULT_DB_PATH
    conn = connect(p)
    try:
        conn.executescript(SCHEMA)
        conn.commit()
    finally:
        conn.close()
    return p


def _upsert_lead_conn(
    conn: sqlite3.Connection,
    url: str,
    *,
    email: str | None,
    score: int | None,
    reasons: str | None,
    niche: str | None,
) -> None:
    now = _utc_now()
    host = _host_from_url(url) or ""
    cur = conn.execute("SELECT id FROM leads WHERE url = ?", (url,))
    if cur.fetchone():
        conn.execute(
            """
            UPDATE leads SET host=?, email=?, score=?, reasons=?, niche=?, updated_at=?
            WHERE url=?
            """,
            (host, email, score, reasons, niche, now, url),
        )
    else:
        conn.execute(
            """
            INSERT INTO leads (url, host, email, score, reasons, niche, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (url, host, email, score, reasons, niche, now, now),
        )


def upsert_lead(
    url: str,
    *,
    email: str | None,
    score: int | None,
    reasons: str | None,
    niche: str | None,
    path: Path | str | None = None,
) -> None:
    init_db(path)
    conn = connect(path)
    try:
        _upsert_lead_conn(conn, url, email=email, score=score, reasons=reasons, niche=niche)
        conn.commit()
    finally:
        conn.close()


def save_rows_from_finder(
    rows: list[Any],
    niche: str,
    path: Path | str | None = None,
) -> int:
    """rows: список LeadRow (url, score, email_or_phone, reasons)."""
    init_db(path)
    conn = connect(path)
    n = 0
    try:
        for r in rows:
            contact = getattr(r, "email_or_phone", "") or ""
            email = contact if "@" in contact else None
            _upsert_lead_conn(
                conn,
                r.url,
                email=email,
                score=getattr(r, "score", None),
                reasons=getattr(r, "reasons", None),
                niche=niche or None,
            )
            n += 1
        conn.commit()
    finally:
        conn.close()
    return n


def list_leads(
    limit: int = 100,
    path: Path | str | None = None,
) -> list[dict[str, Any]]:
    init_db(path)
    conn = connect(path)
    try:
        cur = conn.execute(
            """
            SELECT id, url, host, email, score, reasons, niche, created_at, updated_at
            FROM leads ORDER BY updated_at DESC LIMIT ?
            """,
            (limit,),
        )
        return [dict(row) for row in cur.fetchall()]
    finally:
        conn.close()


def _main() -> None:
    ap = argparse.ArgumentParser(description="База лидов webmorp (SQLite)")
    sub = ap.add_subparsers(dest="cmd", required=True)

    def add_db_arg(p: argparse.ArgumentParser) -> None:
        p.add_argument(
            "--db",
            metavar="PATH",
            default=str(DEFAULT_DB_PATH),
            help=f"Путь к leads.db (по умолчанию: {DEFAULT_DB_PATH})",
        )

    p_init = sub.add_parser("init", help="Создать таблицы")
    add_db_arg(p_init)

    p_list = sub.add_parser("list", help="Показать последние записи")
    add_db_arg(p_list)
    p_list.add_argument("--limit", type=int, default=50)

    p_export = sub.add_parser("export", help="Экспорт в JSON")
    add_db_arg(p_export)
    p_export.add_argument("out", help="Файл .json")
    p_export.add_argument("--limit", type=int, default=10_000)

    args = ap.parse_args()
    db_path = Path(args.db)

    if args.cmd == "init":
        p = init_db(db_path)
        print(f"OK: {p}")
        return

    if args.cmd == "list":
        init_db(db_path)
        for row in list_leads(limit=args.limit, path=db_path):
            e = row.get("email") or "—"
            print(
                f"{row['id']}\t{row['score']}\t{e}\t{row['url']}\t{row.get('niche') or ''}"
            )
        return

    if args.cmd == "export":
        init_db(db_path)
        conn = connect(db_path)
        try:
            cur = conn.execute(
                "SELECT * FROM leads ORDER BY updated_at DESC LIMIT ?",
                (int(args.limit),),
            )
            cols = [c[0] for c in cur.description]
            rows = [dict(zip(cols, row)) for row in cur.fetchall()]
        finally:
            conn.close()
        Path(args.out).write_text(
            json.dumps(rows, indent=2, ensure_ascii=False),
            encoding="utf-8",
        )
        print(f"Exported {len(rows)} rows → {args.out}")
        return


if __name__ == "__main__":
    _main()
