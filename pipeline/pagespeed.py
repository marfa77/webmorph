"""
Google PageSpeed Insights API v5 — mobile performance score (Lighthouse 0–100).
https://developers.google.com/speed/docs/insights/v5/get-started
"""

from __future__ import annotations

import logging
from typing import Any

import requests

logger = logging.getLogger(__name__)

PSI_URL = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed"


def fetch_psi_mobile_score(url: str, api_key: str, *, timeout: int = 120) -> int | None:
    """
    Возвращает performance score 0–100 для strategy=mobile или None при ошибке/нет данных.
    В API поле score в диапазоне 0–1 — умножаем на 100 и округляем.
    """
    key = (api_key or "").strip()
    if not key:
        return None
    u = (url or "").strip()
    if not u:
        return None
    try:
        r = requests.get(
            PSI_URL,
            params={
                "url": u,
                "strategy": "mobile",
                "category": "performance",
                "key": key,
            },
            timeout=timeout,
        )
        if r.status_code != 200:
            logger.warning("PSI HTTP %s for %s: %s", r.status_code, u, r.text[:200])
            return None
        data: dict[str, Any] = r.json()
        lr = data.get("lighthouseResult") or {}
        cats = lr.get("categories") or {}
        perf = cats.get("performance") or {}
        raw = perf.get("score")
        if raw is None:
            return None
        try:
            x = float(raw)
        except (TypeError, ValueError):
            return None
        return max(0, min(100, int(round(x * 100))))
    except requests.RequestException as e:
        logger.warning("PSI request failed for %s: %s", u, e)
        return None
