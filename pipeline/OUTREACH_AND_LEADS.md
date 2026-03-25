# Поиск лидов и рассылка (webmorp pipeline)

Документ описывает реализацию: как собираются URL и email в SQLite, как формируются письма и как они уходят с лимитами и учётом отправленных.

**Полная целевая воронка** (PageSpeed + BuiltWith, Instantly, Gemini/Imagen, Netlify preview, Gumroad): см. **[OUTREACH_PIPELINE_SPEC.md](./OUTREACH_PIPELINE_SPEC.md)** — там фазы 1–4, квалификация, шаблоны писем, follow-up, AI JSON, риски и порядок запуска.

---

## 1. Общая схема

```
DuckDuckGo → finder.py (оценка страницы, email, отсев e-commerce) → leads.db
                    ↓
         collect_leads.py (много ниш, цель по количеству)
                    ↓
         psi_enrich.py (опционально: PageSpeed mobile → psi_mobile_score)
                    ↓
         export_outreach_md.py → outreach-batch-*.md (черновики; опц. --psi-slow-only)
                    ↓
         send_outreach.py → SMTP или Microsoft Graph → outreach_sent
```

Файл базы по умолчанию: `pipeline/leads.db` (в `.gitignore`, не коммитится).

---

## 2. База данных (`leads_db.py`)

### Таблица `leads`

| Поле        | Назначение |
|------------|------------|
| `id`       | Автоинкремент |
| `url`      | URL страницы (уникальный ключ upsert) |
| `host`     | Домен без `www.` |
| `email`    | Контакт для рассылки (если найден `@`) |
| `score`    | Балл «устаревшести» 1–10 (finder) |
| `reasons`  | Текстовые причины скоринга |
| `niche`    | Строка ниши при сохранении из finder/collect |
| `psi_mobile_score` | Mobile performance 0–100 (Lighthouse через PageSpeed API), после `psi_enrich.py` |
| `psi_checked_at` | ISO UTC время последнего запроса PSI по строке |
| `created_at`, `updated_at` | ISO UTC |

Инициализация: `python leads_db.py init --db leads.db`.

### Таблицы рассылки

- **`outreach_meta`** — ключ–значение, например `campaign_start_date` (если не задан `OUTREACH_START_DATE` в `.env`).
- **`outreach_sent`** — один ряд на **email** (PRIMARY KEY): `lead_id`, `sent_at`, `subject`, `source` (`smtp` | `graph` | `manual`). Повторная отправка на тот же адрес блокируется.

---

## 3. Поиск сайтов и адресов (`finder.py`)

### 3.1 Источник поиска

- Поисковые запросы строятся в `build_search_queries()`: ниша + несколько **англоязычных рынков** (USA, Dubai, UK, Australia, Canada и т.д.) + варианты вроде `contact`, `powered by WordPress`, старый copyright.
- Результаты забираются через **DuckDuckGo** (`ddgs` / `duckduckgo_search`), без API-ключа.

### 3.2 Фильтрация URL

- Исключаются агрегаторы, соцсети, каталоги, `.gov`/`.edu`, типичные пути `/blog/`, `/directory/` и т.п. (`_SKIP_HOST_SUBSTR`, `_host_ok`).

### 3.3 Обработка каждого URL

1. HTTP GET страницы (таймаут ~14 с, `User-Agent` из `scraper`).
2. **Отсев не-визиток / нестатики**: если в HTML есть признаки **магазина** (корзина, checkout, Shopify/WooCommerce и т.д.), **CMS** (WordPress `wp-content`, Drupal, Joomla, Ghost, Craft…), **конструкторов** (Wix, Squarespace, Webflow, Weebly, HubSpot sites, Duda…), **SSR/SPA-оболочек** (Next/Nuxt/Gatsby/React root и т.п.), URL **отбрасывается** — в выдаче остаются по возможности **простые статические** одностраничники без типового движка (`_looks_like_non_static_brochure`).
3. **Скоринг** `_score_page`: нет viewport, старый ©, WordPress/jQuery 1.x, табличная вёрстка и др. → балл до 10; ниже `min_score` (по умолчанию 5) отбрасывается.
4. **Email**: regex по HTML; при необходимости заход на страницу контакта по ссылке из меню.
5. **Привязка email к сайту** `_email_matches_site`: предпочтение адресу на том же домене (или совпадение «основного» домена второго уровня).
6. Опционально `--require-email`: в выборку попадают только лиды с валидным для домена email (для рассылки).

### 3.4 CLI `finder.py`

Пример:

```bash
python finder.py "plumbing service" --require-email --db leads.db --limit 50
```

Параметры: `--region`, `--min-score`, `--per-query`, `--limit`, `--out file.json`, `--dry-search`.

Сохранение в БД: флаг `--db` (путь опционально, по умолчанию `pipeline/leads.db`) → `save_rows_from_finder()`.

---

## 4. Пакетный сбор (`collect_leads.py`)

- Крутит **список ниш** (`DEFAULT_NICHES`, ~50 SMB-тем).
- Для каждой ниши вызывает `search_leads()` с `require_email=True` (если не передан `--allow-no-email`).
- Останавливается, когда `COUNT(leads WHERE email не пустой) >= --target` (по умолчанию 1000), или после `--max-rounds` полных проходов по списку ниш.
- Между нишами пауза `--sleep-between` (снижение риска лимитов DDG).
- Длинные прогоны удобно запускать в фоне с логом: `nohup … >> collect_leads.log 2>&1 &`.

---

## 5. PageSpeed Insights — второй слой (`psi_enrich.py`, `pagespeed.py`)

- После того как лид в БД с **email** (finder уже отсёк e-commerce), можно прогнать **Google PageSpeed Insights API** (mobile): в `leads` пишутся **`psi_mobile_score`** (0–100) и **`psi_checked_at`**.
- Ключ в `.env`: **`PAGESPEED_API_KEY`** или **`GOOGLE_API_KEY`** (если в Google Cloud включён PageSpeed Insights API для этого ключа). Документация: [PageSpeed API v5](https://developers.google.com/speed/docs/insights/v5/get-started).
- Запуск: `python psi_enrich.py --db leads.db --limit 25 --delay 1.5` (повторный замер только для строк без `psi_checked_at`; **`--force`** — пересчитать всех в лимите).
- **Отсев «уже быстрых»:** при экспорте/рассылке флаг **`--psi-slow-only`** оставляет только лидов с измеренным score **строго меньше** порога (по умолчанию **55**), т.е. целимся в медленные мобильные страницы. Порог: `--psi-threshold 55` или переменная окружения для send (см. §6).

## 6. Экспорт в Markdown (`export_outreach_md.py`)

- Читает `leads` с непустым `email`, сортирует по `score DESC`, фильтрует **блоклист** доменов (`_HOST_BLOCK_SUBSTR`).
- Генерирует `outreach-batch-2.md`: таблицы To / Subject / URL / score / **PSI mobile** / niche + тело письма через **`build_email_body`**: если есть **`psi_mobile_score`**, в тексте и теме фигурирует честный балл PageSpeed; иначе — общий вариант без цифры.
- **Тема** (`subject_problem`): при наличии PSI — `{host} — {N}/100 mobile speed`; иначе — формулировка про медленность/устаревание на мобильных.
- Запуск: `python export_outreach_md.py -o outreach-batch-2.md --limit 50`  
  С фильтром медленных: `python export_outreach_md.py --psi-slow-only --psi-threshold 55`

---

## 7. Отправка писем (`send_outreach.py`)

### 7.1 Очередь

- Выбираются лиды с email, **отсутствующие** в `outreach_sent` (сравнение `lower(email)`).
- Порядок: как в экспорте — `score DESC`, `id DESC`, минус заблокированные хосты.

### 7.2 Лимит по дням (рампинг)

- Нужна дата старта: **`OUTREACH_START_DATE`** в `pipeline/.env` или `send_outreach.py set-start-date YYYY-MM-DD` → `outreach_meta`.
- **«Сегодня»** считается в часовом поясе **`OUTREACH_TZ`** (по умолчанию UTC).
- **Дни 0–13:** не более **20** писем за календарный день.
- **Со дня 14:** каждую полную неделю **+10** к дневному лимиту (14–20-й день → 30, следующая неделя → 40, …).

### 7.3 Каналы отправки

| Режим | Условие | Механизм |
|--------|---------|----------|
| **Graph** | `OUTREACH_SEND_BACKEND=graph` **или** заданы `GRAPH_TENANT_ID`, `GRAPH_CLIENT_ID`, `GRAPH_CLIENT_SECRET` | OAuth2 client credentials → токен → `POST .../users/{upn}/sendMail` (разрешение **Mail.Send** application + admin consent). Отправитель: **`GRAPH_FROM_USER`** или fallback на `SMTP_FROM` / `SMTP_USER`. |
| **SMTP** | Иначе | `smtplib`, переменные `SMTP_*` из `.env`. |

Тело и тема те же, что в `export_outreach_md` (`build_email_body`, `subject_problem`).

### 7.4 Поведение при отправке

- Между письмами случайная пауза **45–120 с** (настраивается `--min-delay` / `--max-delay`; `--no-delay` для тестов).
- После успешной отправки — `INSERT` в `outreach_sent`, поле `source`: `graph` или `smtp`.
- Ручная пометка «уже отправлено»: `mark-sent --emails …` или `--file` (чтобы не слать повторно и чтобы учесть в дневном лимите).

### 7.5 Команды и PSI

```bash
python send_outreach.py --help          # справка
python send_outreach.py status
python send_outreach.py send --dry-run
python send_outreach.py send
python send_outreach.py send --psi-slow-only   # только PSI mobile < 55 (или порог из --psi-threshold)
python send_outreach.py test-graph      # только токен Graph
python send_outreach.py mark-sent --emails "a@b.com"
python send_outreach.py set-start-date 2026-03-24
```

Переменные окружения: см. `outreach.env.example` и вывод `--help`. Дополнительно: **`OUTREACH_PSI_SLOW_ONLY=1`** — то же, что `send --psi-slow-only` (фильтр медленных по PSI).

Тело и тема совпадают с логикой `export_outreach_md` (`build_email_body`, `subject_problem`).

---

## 8. Вспомогательные скрипты

- **`enable_smtp_auth.ps1`** — PowerShell: `Connect-ExchangeOnline -Device` + `Set-CASMailbox` для SMTP AUTH (если почта на M365).
- Секреты и ключи только в **`pipeline/.env`** (не в репозитории).

---

## 9. Ограничения и риски

- **DDG**: нет гарантии стабильности и объёма выдачи; возможны лимиты и «мусорные» URL — ручная проверка выборки перед массовой рассылкой желательна.
- **PageSpeed API**: квоты и биллинг по ключу Google Cloud; часть URL может не отдать score (таймаут, блокировка ботом) — тогда `psi_mobile_score` остаётся `NULL`, при `--psi-slow-only` такие лиды не попадут в очередь.
- **Право и доставляемость**: холодные письма должны соответствовать местным законам (CAN-SPAM, GDPR и т.д.); лимиты и паузы снижают, но не устраняют риски блокировок.
- **Microsoft 365**: при отключённом SMTP AUTH и Security defaults надёжный путь — **Graph**, не пароль SMTP.

---

## 10. Быстрый чеклист «с нуля»

1. `python leads_db.py init`
2. `python collect_leads.py --target N` или `finder.py … --db leads.db`
3. (Опционально) `python psi_enrich.py --db leads.db --limit 25` — после добавить в `.env` `PAGESPEED_API_KEY`; для рассылки только по медленным: `export_outreach_md.py --psi-slow-only` и `send_outreach.py send --psi-slow-only`
4. `python export_outreach_md.py` — выборочно проверить MD
5. Заполнить `.env` (Graph или SMTP + `OUTREACH_START_DATE`, `OUTREACH_TZ`)
6. `python send_outreach.py test-graph` или тест SMTP
7. `send --dry-run` → `send`

---

*Последнее обновление документа: по состоянию репозитория pipeline (finder, collect_leads, psi_enrich, export_outreach_md, send_outreach, leads_db).*
