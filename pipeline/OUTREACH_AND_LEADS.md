# Поиск лидов и рассылка (webmorp pipeline)

Документ описывает реализацию: как собираются URL и email в SQLite, как формируются письма и как они уходят с лимитами и учётом отправленных.

---

## 1. Общая схема

```
DuckDuckGo → finder.py (оценка страницы, email) → leads.db
                    ↓
         collect_leads.py (много ниш, цель по количеству)
                    ↓
         export_outreach_md.py → outreach-batch-*.md (черновики для ручной проверки)
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
2. **Скоринг** `_score_page`: нет viewport, старый ©, WordPress/jQuery 1.x, табличная вёрстка и др. → балл до 10; ниже `min_score` (по умолчанию 5) отбрасывается.
3. **Email**: regex по HTML; при необходимости заход на страницу контакта по ссылке из меню.
4. **Привязка email к сайту** `_email_matches_site`: предпочтение адресу на том же домене (или совпадение «основного» домена второго уровня).
5. Опционально `--require-email`: в выборку попадают только лиды с валидным для домена email (для рассылки).

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

## 5. Экспорт в Markdown (`export_outreach_md.py`)

- Читает `leads` с непустым `email`, сортирует по `score DESC`, фильтрует **блоклист** доменов (`_HOST_BLOCK_SUBSTR`).
- Генерирует `outreach-batch-2.md`: таблицы To / Subject / URL / score / niche + тело письма из **`EMAIL_TEMPLATE`**.
- **Тема** (`subject_problem`): коротко формулирует «проблему» сайта (мобильность, устаревание, 2026), без бренда в subject.
- Запуск: `python export_outreach_md.py -o outreach-batch-2.md --limit 50`.

---

## 6. Отправка писем (`send_outreach.py`)

### 6.1 Очередь

- Выбираются лиды с email, **отсутствующие** в `outreach_sent` (сравнение `lower(email)`).
- Порядок: как в экспорте — `score DESC`, `id DESC`, минус заблокированные хосты.

### 6.2 Лимит по дням (рампинг)

- Нужна дата старта: **`OUTREACH_START_DATE`** в `pipeline/.env` или `send_outreach.py set-start-date YYYY-MM-DD` → `outreach_meta`.
- **«Сегодня»** считается в часовом поясе **`OUTREACH_TZ`** (по умолчанию UTC).
- **Дни 0–13:** не более **20** писем за календарный день.
- **Со дня 14:** каждую полную неделю **+10** к дневному лимиту (14–20-й день → 30, следующая неделя → 40, …).

### 6.3 Каналы отправки

| Режим | Условие | Механизм |
|--------|---------|----------|
| **Graph** | `OUTREACH_SEND_BACKEND=graph` **или** заданы `GRAPH_TENANT_ID`, `GRAPH_CLIENT_ID`, `GRAPH_CLIENT_SECRET` | OAuth2 client credentials → токен → `POST .../users/{upn}/sendMail` (разрешение **Mail.Send** application + admin consent). Отправитель: **`GRAPH_FROM_USER`** или fallback на `SMTP_FROM` / `SMTP_USER`. |
| **SMTP** | Иначе | `smtplib`, переменные `SMTP_*` из `.env`. |

Тело и тема те же, что в `export_outreach_md` (`EMAIL_TEMPLATE`, `subject_problem`).

### 6.4 Поведение при отправке

- Между письмами случайная пауза **45–120 с** (настраивается `--min-delay` / `--max-delay`; `--no-delay` для тестов).
- После успешной отправки — `INSERT` в `outreach_sent`, поле `source`: `graph` или `smtp`.
- Ручная пометка «уже отправлено»: `mark-sent --emails …` или `--file` (чтобы не слать повторно и чтобы учесть в дневном лимите).

### 6.5 Команды

```bash
python send_outreach.py --help          # справка
python send_outreach.py status
python send_outreach.py send --dry-run
python send_outreach.py send
python send_outreach.py test-graph      # только токен Graph
python send_outreach.py mark-sent --emails "a@b.com"
python send_outreach.py set-start-date 2026-03-24
```

Переменные окружения: см. `outreach.env.example` и вывод `--help`.

---

## 7. Вспомогательные скрипты

- **`enable_smtp_auth.ps1`** — PowerShell: `Connect-ExchangeOnline -Device` + `Set-CASMailbox` для SMTP AUTH (если почта на M365).
- Секреты и ключи только в **`pipeline/.env`** (не в репозитории).

---

## 8. Ограничения и риски

- **DDG**: нет гарантии стабильности и объёма выдачи; возможны лимиты и «мусорные» URL — ручная проверка выборки перед массовой рассылкой желательна.
- **Право и доставляемость**: холодные письма должны соответствовать местным законам (CAN-SPAM, GDPR и т.д.); лимиты и паузы снижают, но не устраняют риски блокировок.
- **Microsoft 365**: при отключённом SMTP AUTH и Security defaults надёжный путь — **Graph**, не пароль SMTP.

---

## 9. Быстрый чеклист «с нуля»

1. `python leads_db.py init`
2. `python collect_leads.py --target N` или `finder.py … --db leads.db`
3. `python export_outreach_md.py` — выборочно проверить MD
4. Заполнить `.env` (Graph или SMTP + `OUTREACH_START_DATE`, `OUTREACH_TZ`)
5. `python send_outreach.py test-graph` или тест SMTP
6. `send --dry-run` → `send`

---

*Последнее обновление документа: по состоянию репозитория pipeline (finder, collect_leads, export_outreach_md, send_outreach, leads_db).*
