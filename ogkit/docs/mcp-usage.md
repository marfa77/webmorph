# MCP Usage в ogkit

## Главное правило

**Не проверяй файловую систему — сразу вызывай инструмент.**

Агент часто смотрит в `~/.cursor/projects/.../mcps/` и, если там нет папки сервера, говорит «недоступно». Это неправильно. Нужно просто вызвать `CallMcpTool` — если сервер жив, он ответит.

---

## Supabase MCP

**project_id** для ogkit: `umavyllbeonoruheoddo`  
(берётся из `NEXT_PUBLIC_SUPABASE_URL` — часть между `https://` и `.supabase.co`)

### Применить миграцию

```
server: plugin-supabase-supabase
tool:   apply_migration
args:
  project_id: umavyllbeonoruheoddo
  name:       snake_case_название
  query:      <SQL>
```

Пример — добавить колонку:
```sql
alter table public.users add column if not exists some_col text;
```

### Выполнить произвольный SQL

```
server: plugin-supabase-supabase
tool:   execute_sql
args:
  project_id: umavyllbeonoruheoddo
  query:      select count(*) from public.users;
```

### Список таблиц

```
server: plugin-supabase-supabase
tool:   list_tables
args:
  project_id: umavyllbeonoruheoddo
  schemas:    ["public"]
```

### Список миграций

```
server: plugin-supabase-supabase
tool:   list_migrations
args:
  project_id: umavyllbeonoruheoddo
```

---

## Миграции ogkit

| Файл | Что делает |
|------|-----------|
| `supabase/migrations/20250424120000_init_schema.sql` | Базовая схема: users, api_keys, usage_events, subscriptions |
| `supabase/migrations/20250424130000_subscription_waitlist.sql` | Таблица waitlist |
| `supabase/migrations/20260424130000_crypto_billing.sql` | Crypto billing: `users.crypto_paid_until`, таблица `crypto_billing_orders` |

Все миграции идемпотентны (`if not exists`, `drop trigger if exists`).

Если нужно применить конкретную — берёшь SQL из файла и кидаешь через `apply_migration`.

---

## Если агент говорит "MCP недоступен"

Не верь. Скажи: **«просто вызови tool»**. Агент должен вызвать `CallMcpTool` напрямую, а не искать папки.
