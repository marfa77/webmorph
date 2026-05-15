# Legacy: PostgreSQL / Supabase SQL

OGKit **uses MySQL + Drizzle** now (`src/lib/db/schema.ts`, `drizzle/` migrations).

The SQL files here are kept as **historical reference** (triggers, RLS, enum names) when porting behaviour or auditing parity. Do not run them against the current app database.

Apply schema with:

```bash
npm run db:migrate
```

See the repo **`README.md`** section **Database (MySQL + Drizzle)**.
