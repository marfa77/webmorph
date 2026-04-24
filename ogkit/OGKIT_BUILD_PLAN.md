# OGKIT — Auto-Agent Build Plan

> **Audience**: Coding agent executing this plan autonomously. Assume low reasoning ability. Every decision is frozen. Every command is exact. Never deviate from versions, paths, or values. When in doubt, re-read the section.

> **Human checkpoints** are marked `🔴 HUMAN ACTION`. Agent must STOP and wait for human confirmation at these steps. Every other step the agent executes itself.

---

## 0. Locked Project Constants

Do not change. Do not ask. Use these literal values everywhere.

| Key | Value |
|---|---|
| `project_name` | `ogkit` |
| `display_name` | `OGKit` |
| `tagline` | "OG image API for every framework" |
| `domain` | `ogkit.dev` (human must own; if not available use `ogkit.app`) |
| `github_org` | human's personal GitHub username (ask once at Phase 1) |
| `github_repo` | `ogkit` |
| `project_path` | `/Users/pavelveselov/Projects/ogkit` |
| `package_manager` | `pnpm` |
| `node_version` | `20.x` (use `nvm use 20`) |
| `next_version` | `^14.2.0` |
| `typescript_version` | `^5.4.0` |
| `default_branch` | `main` |
| `license` | `MIT` |
| `free_tier_monthly_cap` | `100` |
| `free_tier_daily_cap` | `10` |
| `pro_tier_monthly_cap` | `50000` |
| `pro_tier_price_usd` | `19` |
| `scale_tier_monthly_cap` | `1000000` |
| `scale_tier_price_usd` | `99` |
| `api_key_prefix` | `ogk_live_` |
| `free_watermark_text` | `og by ogkit.dev` |
| `support_email` | `support@ogkit.dev` |

---

## Required Environment Variables (Canonical List)

Agent writes this list to `.env.example` verbatim. Real values go to `.env.local` (local dev) and Vercel project settings (production).

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# LemonSqueezy (billing; Merchant of Record — handles EU VAT + US sales tax)
LEMON_API_KEY=
LEMON_STORE_ID=
LEMON_WEBHOOK_SECRET=
LEMON_VARIANT_PRO_MONTHLY=
LEMON_VARIANT_SCALE_MONTHLY=

# Telegram (operations monitoring — ALL events: signups, payments, errors, daily summary)
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=

# Public URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Transactional email
RESEND_API_KEY=

# Observability
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_AUTH_TOKEN=

# Cron / webhook security
CRON_SECRET=

# IndexNow (for SEO submissions)
INDEXNOW_KEY=
```

---

# Phase 1 — External Accounts & Human Checkpoints

**Goal**: Provision all external services. Collect all secrets. Write them to `.env.local`. Once done, phases 2+ run without human input.

**Prereq**: Nothing.
**Duration**: 60–90 min (human, one-shot).

## Task 1.1 — Confirm domain

🔴 HUMAN ACTION
- Human buys `ogkit.dev` on Namecheap / Cloudflare Registrar / Porkbun.
- If taken, falls back to `ogkit.app`.
- Agent updates constant `domain` in this file if fallback chosen.

**Verify**: `whois ogkit.dev` returns human's registration.

## Task 1.2 — Supabase project

🔴 HUMAN ACTION
- Go to https://supabase.com → New Project.
- Name: `ogkit-prod`. Region: nearest to Europe (e.g. `eu-central-1`).
- Database password: generate + save to password manager.
- After ready (~2 min), copy:
  - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
  - Anon key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - Service role key → `SUPABASE_SERVICE_ROLE_KEY`

**Verify**: `curl $NEXT_PUBLIC_SUPABASE_URL/rest/v1/` with `apikey` header returns JSON.

## Task 1.3 — LemonSqueezy store + products

🔴 HUMAN ACTION (one-time, ~20–30 min)

LemonSqueezy is the **Merchant of Record** — they collect payments under their own legal entity, handle EU VAT / UK VAT / US sales tax / 1099-K forms automatically, and remit taxes. You (the seller) get paid via PayPal or Wise monthly minus ~5% + $0.50 per transaction. No US LLC, no Stripe Atlas, no tax accountant needed.

### Step 1 — Sign up and create store

1. Go to https://www.lemonsqueezy.com → Sign up (Google/email).
2. **Create a new store**:
   - Store name: `OGKit`
   - Store URL: `ogkit.lemonsqueezy.com` (default checkout domain; custom domain optional later)
   - Store currency: `USD`
   - Store country: your country of residence (for payouts)
3. **KYC / Identity verification** — LS will ask for:
   - Full legal name / business name
   - Address
   - Government ID (passport or national ID scan)
   - Tax info (TIN / personal tax ID from your country — used on LS's side, you don't need US EIN)
   - Payout method: **Wise** (recommended, works globally) or **PayPal**
   - Expect approval within 24–48 hours. **Do not proceed to launch until store is approved.** Other phases can continue in parallel.

### Step 2 — Create subscription products

In LS dashboard → **Products → New product**. Create **two separate products**, each with one monthly variant:

Product 1: **OGKit Pro**
- Type: `Subscription`
- Name: `OGKit Pro`
- Description: `10,000 OG images per month. No watermark. All templates.`
- Statement descriptor: `OGKIT PRO` (shown on customer card statements, max 22 chars)
- Thumbnail: skip for now (can add later)
- **Variant / Pricing**:
  - Name: `Monthly`
  - Price: `$19.00 USD`
  - Interval: `Every 1 month`
  - Trial: none (add later if needed)
  - Tax category: `Software as a Service (SaaS)`
- Save → copy the **Variant ID** (number, e.g. `123456`) → `LEMON_VARIANT_PRO_MONTHLY`

Product 2: **OGKit Scale**
- Same as above but Name `OGKit Scale`, descriptor `OGKIT SCALE`, price `$99.00 USD`, description `100,000 images/month. Priority rendering. All templates + custom fonts.`
- Save → copy **Variant ID** → `LEMON_VARIANT_SCALE_MONTHLY`

### Step 3 — Get API credentials

1. LS dashboard → **Settings → API** → **Create API key**.
   - Name: `ogkit-production`
   - Scope: all (LS doesn't scope per-resource yet)
   - Copy the token (starts with `eyJ0...`) → `LEMON_API_KEY`. **Shown only once.**
2. LS dashboard → **Settings → Stores** → click your store → copy the numeric **Store ID** → `LEMON_STORE_ID`.

### Step 4 — Webhook secret (placeholder now, endpoint registered in Phase 18)

1. Generate a webhook signing secret locally:

   ```bash
   openssl rand -hex 32
   ```

2. Save the output → `LEMON_WEBHOOK_SECRET`. You'll paste this same value into the LS webhook config in Phase 18 after the prod domain is live.

**Verify**:

```bash
curl -H "Authorization: Bearer $LEMON_API_KEY" \
     -H "Accept: application/vnd.api+json" \
     https://api.lemonsqueezy.com/v1/stores/$LEMON_STORE_ID
```

Returns JSON with `data.attributes.name = "OGKit"`. If 401 → API key wrong. If 404 → store ID wrong.

## Task 1.4 — GitHub repo

🔴 HUMAN ACTION
- Create empty public repo at `https://github.com/{github_org}/ogkit`.
- Do **not** initialize with README / .gitignore / LICENSE (agent will create).

**Verify**: `git ls-remote git@github.com:{github_org}/ogkit.git` returns empty.

## Task 1.5 — Vercel project

🔴 HUMAN ACTION
- Go to https://vercel.com → Add New → Project.
- Import the GitHub repo `ogkit`.
- Framework preset: Next.js.
- **Do not deploy yet**. Agent configures env vars first.

**Verify**: Vercel dashboard shows the project connected to GitHub.

## Task 1.6 — Resend account

🔴 HUMAN ACTION
- Sign up at https://resend.com. Free tier = 3000 emails/mo.
- Add domain `ogkit.dev`. Add DNS records (SPF, DKIM, DMARC) at registrar.
- API key → `RESEND_API_KEY`.

**Verify**: Resend dashboard shows domain verified.

## Task 1.7 — Sentry account

🔴 HUMAN ACTION
- Sign up at https://sentry.io (free tier OK).
- Create new project: platform = Next.js, name = `ogkit`.
- DSN → `NEXT_PUBLIC_SENTRY_DSN`.
- Auth token (from settings → auth tokens, scope: `project:releases`, `project:write`) → `SENTRY_AUTH_TOKEN`.

## Task 1.8 — Generate random secrets

Agent runs:

```bash
openssl rand -hex 32
```

Run 2 times, save values to:
- `CRON_SECRET`
- `INDEXNOW_KEY` (first 32 hex chars)

## Task 1.9 — Telegram bot for ops monitoring

🔴 HUMAN ACTION (~5 min)

You'll get real-time pings in Telegram for every signup, API key creation, subscription change, payment failure, churn, quota burst, and daily summary. Single private chat with a bot you own.

### Step 1 — Create the bot

1. Open Telegram → search `@BotFather` → start chat.
2. Send `/newbot`.
3. Bot display name: `OGKit Ops` (any string).
4. Bot username: must end in `bot`, e.g. `ogkit_ops_bot`. If taken, try `ogkit_ops_{random3}_bot`.
5. BotFather replies with an HTTP API token like `7841234567:AAH...xyz`. Save → `TELEGRAM_BOT_TOKEN`.
6. Optional hardening: `/setprivacy` → choose your bot → `Enable` (bot ignores group messages not directed at it). Not strictly needed since we only push, never read.

### Step 2 — Get your chat ID

**Option A — Private chat with the bot (simplest, solo founder)**:
1. Open Telegram → search your bot username (e.g. `@ogkit_ops_bot`) → start chat → send any message (e.g. `hi`).
2. Open in browser: `https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/getUpdates`
3. Find `"chat":{"id":123456789,...}` in the JSON. That numeric ID → `TELEGRAM_CHAT_ID`. (Your personal user_id; positive integer.)

**Option B — Private channel (recommended if you want to mute / share with a co-founder)**:
1. Telegram → create a private channel, name it `OGKit Ops`.
2. Channel settings → Administrators → Add Admin → search your bot → grant **Post Messages** permission. No other permissions needed.
3. Post any message in the channel.
4. Open: `https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/getUpdates`
5. Find `"chat":{"id":-1001234567890,...}` (channels have negative IDs starting with `-100`). That → `TELEGRAM_CHAT_ID`.

### Step 3 — Verify

```bash
curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
  -d chat_id="${TELEGRAM_CHAT_ID}" \
  -d text="OGKit ops bot wired up ✅" \
  -d parse_mode="Markdown"
```

Returns `{"ok":true,...}` and the message appears in the chat/channel. If `ok:false` with `chat not found` → wrong chat ID. If `Unauthorized` → wrong token.

## Task 1.10 — Finalize `.env.local`

Agent creates `/Users/pavelveselov/Projects/ogkit/.env.local` (AFTER Phase 2 scaffolding) with all values from Phase 1.

---

# Phase 2 — Project Scaffolding

**Prereq**: Phase 1 completed. All secrets collected.
**Duration**: ~30 min.

## Task 2.1 — Create project directory and init

```bash
mkdir -p /Users/pavelveselov/Projects/ogkit
cd /Users/pavelveselov/Projects/ogkit
nvm use 20
```

## Task 2.2 — Initialize Next.js

Run exactly:

```bash
pnpm create next-app@14.2.0 . \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --no-turbopack
```

Accept all prompts. If it errors on non-empty dir, answer "yes" to overwrite.

## Task 2.3 — Install core dependencies

```bash
pnpm add \
  @supabase/supabase-js@^2.45.0 \
  @supabase/ssr@^0.5.0 \
  @lemonsqueezy/lemonsqueezy.js@^4.0.0 \
  satori@^0.10.13 \
  @vercel/og@^0.6.2 \
  zod@^3.23.0 \
  resend@^3.4.0 \
  @sentry/nextjs@^8.0.0 \
  lucide-react@^0.400.0 \
  class-variance-authority@^0.7.0 \
  clsx@^2.1.0 \
  tailwind-merge@^2.3.0 \
  react-email@^2.1.0 \
  @react-email/components@^0.0.20 \
  nanoid@^5.0.0 \
  date-fns@^3.6.0
```

```bash
pnpm add -D \
  @types/node@^20.14.0 \
  prettier@^3.3.0 \
  prettier-plugin-tailwindcss@^0.6.0 \
  supabase@^1.180.0
```

## Task 2.4 — Install Shadcn

```bash
pnpm dlx shadcn@latest init -d
```

Accept defaults: `Default` style, `Slate` base color, CSS vars = `yes`.

Then install components:

```bash
pnpm dlx shadcn@latest add button card input label form dialog sheet dropdown-menu tabs toast select switch textarea badge separator alert alert-dialog table
```

## Task 2.5 — Project folder structure

Agent creates these directories (empty for now, populated in later phases):

```
src/
├── app/
│   ├── (marketing)/
│   │   ├── page.tsx
│   │   ├── pricing/
│   │   ├── for/[framework]/
│   │   ├── use-case/[type]/
│   │   ├── platform/[platform]/
│   │   ├── compare/[slug]/
│   │   └── tools/
│   ├── (app)/
│   │   ├── dashboard/
│   │   ├── playground/
│   │   └── account/
│   ├── (auth)/
│   │   ├── login/
│   │   └── callback/
│   ├── api/
│   │   ├── og/[template]/
│   │   ├── lemon/webhook/
│   │   ├── lemon/checkout/
│   │   ├── lemon/subscription/
│   │   ├── lemon/cancel/
│   │   ├── keys/
│   │   └── cron/
│   ├── docs/
│   ├── sitemap.ts
│   ├── robots.ts
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/          # shadcn
│   ├── marketing/
│   ├── dashboard/
│   ├── playground/
│   └── og-templates/
├── lib/
│   ├── supabase/
│   ├── lemon/
│   ├── og/
│   ├── api/
│   └── utils.ts
├── config/
│   ├── site.ts
│   ├── plans.ts
│   └── templates.ts
└── content/
    ├── frameworks/     # MDX for /for/[framework]
    ├── use-cases/
    ├── platforms/
    └── comparisons/
```

## Task 2.6 — Config files

### `.gitignore` (append to existing)

```
.env.local
.env*.local
.vercel
.vscode/
*.log
.DS_Store
supabase/.branches
supabase/.temp
```

### `.prettierrc`

```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "all",
  "printWidth": 100,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

### `src/config/site.ts`

```ts
export const siteConfig = {
  name: 'OGKit',
  domain: 'ogkit.dev',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://ogkit.dev',
  tagline: 'OG image API for every framework',
  description:
    'Generate dynamic Open Graph images for any framework. One URL, any language. From $9/mo.',
  author: 'OGKit',
  supportEmail: 'support@ogkit.dev',
  twitter: '@ogkitdev',
  github: 'https://github.com/ogkit/ogkit',
}
```

### `src/config/plans.ts`

```ts
export type Plan = 'free' | 'pro' | 'scale'

export const PLANS = {
  free: {
    id: 'free' as const,
    name: 'Free',
    priceMonthly: 0,
    lemonVariantId: null,
    monthlyCap: 100,
    dailyCap: 10,
    watermark: true,
    features: ['100 images / month', 'Watermark on free tier', '10 templates', 'Community support'],
  },
  pro: {
    id: 'pro' as const,
    name: 'Pro',
    priceMonthly: 19,
    lemonVariantId: process.env.LEMON_VARIANT_PRO_MONTHLY!,
    monthlyCap: 50_000,
    dailyCap: null,
    watermark: false,
    features: [
      '50,000 images / month',
      'No watermark',
      'All templates',
      'Email support',
      'Custom fonts (Google Fonts)',
    ],
  },
  scale: {
    id: 'scale' as const,
    name: 'Scale',
    priceMonthly: 99,
    lemonVariantId: process.env.LEMON_VARIANT_SCALE_MONTHLY!,
    monthlyCap: 1_000_000,
    dailyCap: null,
    watermark: false,
    features: [
      '1,000,000 images / month',
      'No watermark',
      'Priority CDN',
      'All templates',
      'Priority support',
    ],
  },
} as const
```

## Task 2.7 — Create `.env.local` from Phase 1 secrets

Human pastes values from Phase 1 into `/Users/pavelveselov/Projects/ogkit/.env.local`.

## Task 2.8 — Verify scaffolding

```bash
pnpm dev
```

Open `http://localhost:3000`. Must show Next.js default page.

**If fails**: stop and report error to human.

## Task 2.9 — First commit

```bash
git init
git add -A
git commit -m "chore: initial scaffold"
git branch -M main
git remote add origin git@github.com:{github_org}/ogkit.git
git push -u origin main
```

---

# Phase 3 — Database Schema

**Prereq**: Supabase project exists. `SUPABASE_SERVICE_ROLE_KEY` set.
**Duration**: 30 min.

## Task 3.1 — Initialize Supabase CLI

```bash
cd /Users/pavelveselov/Projects/ogkit
pnpm supabase init
pnpm supabase login
pnpm supabase link --project-ref {SUPABASE_PROJECT_REF}
```

Get `SUPABASE_PROJECT_REF` from `NEXT_PUBLIC_SUPABASE_URL` (e.g. `https://abcxyz.supabase.co` → ref is `abcxyz`).

## Task 3.2 — Create migration file

```bash
pnpm supabase migration new init_schema
```

Open the created file at `supabase/migrations/{timestamp}_init_schema.sql`. Write this SQL:

```sql
-- ogkit initial schema
-- depends on auth.users (provided by Supabase)

create type public.plan_tier as enum ('free', 'pro', 'scale');
create type public.subscription_status as enum ('trialing', 'active', 'past_due', 'canceled', 'incomplete');

-- 1. users (extends auth.users)
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  plan plan_tier not null default 'free',
  lemon_customer_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_users_lemon_customer_id on public.users(lemon_customer_id);

-- 2. api_keys
create table public.api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null default 'default',
  prefix text not null,                    -- first 12 chars for fast lookup
  hash text not null,                      -- bcrypt/pbkdf2 hash of full key
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index idx_api_keys_prefix_active on public.api_keys(prefix) where revoked_at is null;
create index idx_api_keys_user_id on public.api_keys(user_id);

-- 3. usage_events
create table public.usage_events (
  id bigserial primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  api_key_id uuid references public.api_keys(id) on delete set null,
  template text not null,
  cache_hit boolean not null default false,
  status smallint not null default 200,
  created_at timestamptz not null default now()
);

create index idx_usage_events_user_id_created_at on public.usage_events(user_id, created_at desc);

-- 4. subscriptions
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  lemon_subscription_id text not null unique,
  lemon_variant_id text not null,
  lemon_customer_id text not null,
  plan plan_tier not null,
  status subscription_status not null,
  current_period_start timestamptz not null,
  current_period_end timestamptz not null,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_subscriptions_user_id on public.subscriptions(user_id);

-- RLS: enable but service-role key bypasses. Client uses anon key → users can only see their own data.
alter table public.users enable row level security;
alter table public.api_keys enable row level security;
alter table public.usage_events enable row level security;
alter table public.subscriptions enable row level security;

create policy "users_self_select" on public.users for select using (auth.uid() = id);
create policy "users_self_update" on public.users for update using (auth.uid() = id);

create policy "api_keys_self_all" on public.api_keys for all using (auth.uid() = user_id);

create policy "usage_events_self_select" on public.usage_events for select using (auth.uid() = user_id);

create policy "subscriptions_self_select" on public.subscriptions for select using (auth.uid() = user_id);

-- Auto-create public.users row on auth.users insert
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.users (id, email) values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- updated_at auto-update
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger users_set_updated_at before update on public.users for each row execute function public.set_updated_at();
create trigger subscriptions_set_updated_at before update on public.subscriptions for each row execute function public.set_updated_at();
```

## Task 3.3 — Apply migration

```bash
pnpm supabase db push
```

**Verify**: Supabase Studio → Table Editor shows all 4 tables.

## Task 3.4 — Generate TS types from DB

```bash
pnpm supabase gen types typescript --project-id {SUPABASE_PROJECT_REF} > src/lib/supabase/database.types.ts
```

## Task 3.5 — Commit

```bash
git add -A
git commit -m "feat(db): initial schema with users, api_keys, usage_events, subscriptions"
git push
```

---

# Phase 4 — Supabase Auth (Magic Link)

**Prereq**: Phase 3.
**Duration**: 2 hours.

## Task 4.1 — Supabase client helpers

Create `src/lib/supabase/client.ts`:

```ts
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './database.types'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
```

Create `src/lib/supabase/server.ts`:

```ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from './database.types'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {}
        },
      },
    },
  )
}
```

Create `src/lib/supabase/admin.ts` (service role — server-only):

```ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  )
}
```

## Task 4.2 — Middleware for session refresh

Create `src/middleware.ts`:

```ts
import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    },
  )

  const { data: { user } } = await supabase.auth.getUser()

  const protectedPaths = ['/dashboard', '/account', '/playground']
  const isProtected = protectedPaths.some((p) => request.nextUrl.pathname.startsWith(p))

  if (isProtected && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/og|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
```

## Task 4.3 — Login page

`src/app/(auth)/login/page.tsx`:

```tsx
'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/callback`,
        shouldCreateUser: true,
      },
    })
    setLoading(false)
    if (!error) setSent(true)
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign in to OGKit</CardTitle>
          <CardDescription>Magic link. No password.</CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <p className="text-sm">Check your email for the login link.</p>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Sending...' : 'Send magic link'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
```

## Task 4.4 — Auth callback

`src/app/(auth)/callback/route.ts`:

```ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(`${origin}${next}`)
  }

  return NextResponse.redirect(`${origin}/login?error=auth`)
}
```

## Task 4.5 — Sign out action

`src/lib/auth/signout.ts`:

```ts
'use server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}
```

## Task 4.6 — Configure Supabase email template

🔴 HUMAN ACTION
In Supabase Studio → Authentication → Email Templates → "Magic Link":
- Subject: `Your OGKit sign-in link`
- Body: keep default for now (Phase 17 improves it).

Authentication → URL Configuration:
- Site URL: `https://ogkit.dev` (production) — temporarily `http://localhost:3000` for dev.
- Redirect URLs: add `http://localhost:3000/callback` and `https://ogkit.dev/callback`.

## Task 4.7 — Verify

```bash
pnpm dev
```

- Open `http://localhost:3000/login`
- Enter email → check inbox → click link → redirected to `/dashboard`
- Check Supabase → `auth.users` has new row
- Check Supabase → `public.users` has new row (from trigger)

**If fails**: check Supabase logs → Authentication → error detail.

## Task 4.8 — Commit

```bash
git add -A && git commit -m "feat(auth): magic link login + middleware" && git push
```

---

# Phase 5 — API Key System

**Prereq**: Phase 4.
**Duration**: 3 hours.

## Task 5.1 — Key generation and hashing utilities

`src/lib/api/keys.ts`:

```ts
import { customAlphabet } from 'nanoid'
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'

const nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', 32)

export const KEY_PREFIX = 'ogk_live_'

export function generateKey(): { fullKey: string; prefix: string; hash: string } {
  const secret = nanoid()
  const fullKey = `${KEY_PREFIX}${secret}`
  // prefix used for fast lookup = ogk_live_ + first 4 of secret = 13 chars
  const prefix = `${KEY_PREFIX}${secret.slice(0, 4)}`
  const hash = hashKey(fullKey)
  return { fullKey, prefix, hash }
}

export function hashKey(key: string): string {
  // PBKDF2 is overkill; SHA-256 with fixed salt is enough for API keys because they have 32*6=192 bits entropy
  const salt = process.env.API_KEY_SALT || 'ogkit-static-salt-do-not-change'
  return createHash('sha256').update(key + salt).digest('hex')
}

export function verifyKey(key: string, hash: string): boolean {
  const computed = hashKey(key)
  return timingSafeEqual(Buffer.from(computed, 'hex'), Buffer.from(hash, 'hex'))
}

export function extractPrefix(key: string): string | null {
  if (!key.startsWith(KEY_PREFIX)) return null
  return key.slice(0, KEY_PREFIX.length + 4)
}
```

Add to `.env.local` and `.env.example`:
```
API_KEY_SALT=<run: openssl rand -hex 32>
```

## Task 5.2 — Key management API

`src/app/api/keys/route.ts`:

```ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateKey } from '@/lib/api/keys'
import { z } from 'zod'

const CreateSchema = z.object({ name: z.string().min(1).max(64).default('default') })

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('api_keys')
    .select('id,name,prefix,last_used_at,created_at,revoked_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ keys: data ?? [] })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = CreateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'invalid_body' }, { status: 400 })

  const { fullKey, prefix, hash } = generateKey()

  const { error } = await supabase.from('api_keys').insert({
    user_id: user.id,
    name: parsed.data.name,
    prefix,
    hash,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Return full key ONCE — never retrievable again
  return NextResponse.json({ key: fullKey, prefix })
}
```

`src/app/api/keys/[id]/route.ts` (revoke):

```ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { error } = await supabase
    .from('api_keys')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
```

## Task 5.3 — Key validation middleware (used by /api/og)

`src/lib/api/authenticate.ts`:

```ts
import { createAdminClient } from '@/lib/supabase/admin'
import { extractPrefix, verifyKey } from './keys'

export type AuthResult =
  | { ok: true; userId: string; apiKeyId: string; plan: 'free' | 'pro' | 'scale'; watermark: boolean }
  | { ok: false; status: number; error: string }

export async function authenticateKey(key: string | null): Promise<AuthResult> {
  if (!key) return { ok: false, status: 401, error: 'missing_key' }

  const prefix = extractPrefix(key)
  if (!prefix) return { ok: false, status: 401, error: 'invalid_key_format' }

  const supabase = createAdminClient()

  const { data: keyRow } = await supabase
    .from('api_keys')
    .select('id, user_id, hash, revoked_at')
    .eq('prefix', prefix)
    .is('revoked_at', null)
    .maybeSingle()

  if (!keyRow) return { ok: false, status: 401, error: 'key_not_found' }
  if (!verifyKey(key, keyRow.hash)) return { ok: false, status: 401, error: 'key_invalid' }

  const { data: userRow } = await supabase
    .from('users')
    .select('plan')
    .eq('id', keyRow.user_id)
    .single()

  if (!userRow) return { ok: false, status: 401, error: 'user_not_found' }

  // Update last_used_at (fire-and-forget)
  supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', keyRow.id)
    .then(() => {})

  return {
    ok: true,
    userId: keyRow.user_id,
    apiKeyId: keyRow.id,
    plan: userRow.plan,
    watermark: userRow.plan === 'free',
  }
}
```

## Task 5.4 — Dashboard UI for keys (skeletal — full UI in Phase 10)

`src/app/(app)/dashboard/keys/page.tsx`:

```tsx
'use client'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type Key = { id: string; name: string; prefix: string; last_used_at: string | null; created_at: string; revoked_at: string | null }

export default function KeysPage() {
  const [keys, setKeys] = useState<Key[]>([])
  const [newKey, setNewKey] = useState<string | null>(null)

  async function load() {
    const r = await fetch('/api/keys').then((r) => r.json())
    setKeys(r.keys)
  }
  useEffect(() => { load() }, [])

  async function create() {
    const r = await fetch('/api/keys', { method: 'POST', body: JSON.stringify({ name: 'default' }) })
    const data = await r.json()
    setNewKey(data.key)
    load()
  }

  async function revoke(id: string) {
    if (!confirm('Revoke this key?')) return
    await fetch(`/api/keys/${id}`, { method: 'DELETE' })
    load()
  }

  return (
    <div className="container max-w-4xl py-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>API Keys</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={create}>Create key</Button>
          {newKey && (
            <div className="rounded-md border bg-yellow-50 p-4 text-sm">
              <div className="font-medium">Copy now. You won't see it again.</div>
              <code className="break-all text-xs">{newKey}</code>
            </div>
          )}
          <ul className="space-y-2">
            {keys.map((k) => (
              <li key={k.id} className="flex items-center justify-between rounded border p-3">
                <div>
                  <div className="font-medium">{k.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {k.prefix}••• — last used {k.last_used_at ?? 'never'}
                  </div>
                </div>
                {!k.revoked_at && (
                  <Button variant="destructive" size="sm" onClick={() => revoke(k.id)}>Revoke</Button>
                )}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
```

## Task 5.5 — Verify

- Login → go to `/dashboard/keys`
- Click "Create key" → full key shown once
- Copy key → refresh → full key gone, only prefix visible
- Revoke → list updates

## Task 5.6 — Commit

```bash
git add -A && git commit -m "feat(api): api key generation, hashing, CRUD" && git push
```

---

# Phase 6 — Core OG Image Rendering

**Prereq**: Phase 5.
**Duration**: 4 hours.

## Task 6.1 — Template registry

`src/config/templates.ts`:

```ts
export type TemplateId =
  | 'article'
  | 'product'
  | 'quote'
  | 'podcast'
  | 'event'
  | 'job'
  | 'minimal'
  | 'brand'
  | 'gradient'
  | 'dark-code'

export const TEMPLATE_IDS: TemplateId[] = [
  'article', 'product', 'quote', 'podcast', 'event', 'job', 'minimal', 'brand', 'gradient', 'dark-code',
]

export const TEMPLATE_META: Record<TemplateId, { title: string; description: string }> = {
  article: { title: 'Article', description: 'Blog post with title, subtitle, author, image.' },
  product: { title: 'Product', description: 'E-commerce product card with price.' },
  quote: { title: 'Quote', description: 'Pull quote with author attribution.' },
  podcast: { title: 'Podcast', description: 'Episode card with cover art and show name.' },
  event: { title: 'Event', description: 'Event card with date and location.' },
  job: { title: 'Job', description: 'Job listing with company and location.' },
  minimal: { title: 'Minimal', description: 'Title + subtitle, no frills.' },
  brand: { title: 'Brand', description: 'Centered logo with tagline.' },
  gradient: { title: 'Gradient', description: 'Auto-generated gradient background.' },
  'dark-code': { title: 'Dark Code', description: 'Code snippet with syntax highlighting.' },
}
```

## Task 6.2 — Template components (one per file)

Each template exports a React component that Satori renders. All use `tw=` (inline Tailwind) — Satori supports this via `@vercel/og`.

### `src/components/og-templates/article.tsx`

```tsx
export function ArticleTemplate({
  title, subtitle, author, image, watermark,
}: { title: string; subtitle?: string; author?: string; image?: string; watermark: boolean }) {
  return (
    <div
      style={{
        width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
        background: '#0a0a0a', color: 'white', padding: 60, position: 'relative', fontFamily: 'Inter',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center' }}>
        <div style={{ fontSize: 64, fontWeight: 700, lineHeight: 1.1 }}>{title}</div>
        {subtitle && <div style={{ fontSize: 28, color: '#a1a1aa', marginTop: 20, lineHeight: 1.3 }}>{subtitle}</div>}
        {author && <div style={{ fontSize: 22, color: '#71717a', marginTop: 40 }}>by {author}</div>}
      </div>
      {image && (
        <img src={image} style={{ position: 'absolute', right: 60, bottom: 60, width: 140, height: 140, borderRadius: 70, objectFit: 'cover' }} />
      )}
      {watermark && (
        <div style={{ position: 'absolute', right: 20, bottom: 14, fontSize: 14, color: '#52525b' }}>og by ogkit.dev</div>
      )}
    </div>
  )
}
```

### Other templates

Agent creates 9 more files following the same pattern. Each ~30 lines. Keep visual style distinct but consistent. Don't hallucinate fonts; only Inter.

Template files (create all 10):
- `article.tsx` ✅ (above)
- `product.tsx` — title, price (large), image on left, logo bottom-left
- `quote.tsx` — quote in quotes (), author below, avatar
- `podcast.tsx` — cover on left, title + episode on right, show name above
- `event.tsx` — date badge top-right, title center, location bottom
- `job.tsx` — company logo, title, company + location
- `minimal.tsx` — title + subtitle centered, white bg, black text
- `brand.tsx` — logo centered, tagline below
- `gradient.tsx` — CSS gradient from hashed title (deterministic), title + subtitle white
- `dark-code.tsx` — code block with monospace, title above

For brevity: agent writes the 9 remaining templates following the article.tsx pattern. Each template:
1. Accepts typed props
2. Returns JSX with inline styles (not Tailwind — Satori prefers inline styles)
3. Shows watermark at bottom-right if `watermark === true`
4. Size is always 1200×630 (handled by the route, not template)

## Task 6.3 — Main OG route

`src/app/api/og/[template]/route.tsx`:

```tsx
import { ImageResponse } from 'next/og'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { authenticateKey } from '@/lib/api/authenticate'
import { checkQuota, recordUsage } from '@/lib/api/quota'
import { TEMPLATE_IDS, type TemplateId } from '@/config/templates'
import { ArticleTemplate } from '@/components/og-templates/article'
import { ProductTemplate } from '@/components/og-templates/product'
import { QuoteTemplate } from '@/components/og-templates/quote'
import { PodcastTemplate } from '@/components/og-templates/podcast'
import { EventTemplate } from '@/components/og-templates/event'
import { JobTemplate } from '@/components/og-templates/job'
import { MinimalTemplate } from '@/components/og-templates/minimal'
import { BrandTemplate } from '@/components/og-templates/brand'
import { GradientTemplate } from '@/components/og-templates/gradient'
import { DarkCodeTemplate } from '@/components/og-templates/dark-code'

export const runtime = 'edge'

const ParamsSchema = z.object({
  title: z.string().min(1).max(300),
  subtitle: z.string().max(500).optional(),
  author: z.string().max(100).optional(),
  image: z.string().url().optional(),
  logo: z.string().url().optional(),
  price: z.string().max(40).optional(),
  date: z.string().max(40).optional(),
  location: z.string().max(100).optional(),
  company: z.string().max(100).optional(),
  episode: z.string().max(40).optional(),
  show: z.string().max(100).optional(),
  tagline: z.string().max(200).optional(),
  code: z.string().max(500).optional(),
  language: z.string().max(40).optional(),
  avatar: z.string().url().optional(),
})

function render(template: TemplateId, params: z.infer<typeof ParamsSchema>, watermark: boolean) {
  switch (template) {
    case 'article':   return <ArticleTemplate   title={params.title} subtitle={params.subtitle} author={params.author} image={params.image} watermark={watermark} />
    case 'product':   return <ProductTemplate   title={params.title} price={params.price} image={params.image} logo={params.logo} watermark={watermark} />
    case 'quote':     return <QuoteTemplate     title={params.title} author={params.author} avatar={params.avatar} watermark={watermark} />
    case 'podcast':   return <PodcastTemplate   title={params.title} episode={params.episode} show={params.show} image={params.image} watermark={watermark} />
    case 'event':     return <EventTemplate     title={params.title} date={params.date} location={params.location} image={params.image} watermark={watermark} />
    case 'job':       return <JobTemplate       title={params.title} company={params.company} location={params.location} logo={params.logo} watermark={watermark} />
    case 'minimal':   return <MinimalTemplate   title={params.title} subtitle={params.subtitle} watermark={watermark} />
    case 'brand':     return <BrandTemplate     title={params.title} tagline={params.tagline} logo={params.logo} watermark={watermark} />
    case 'gradient':  return <GradientTemplate  title={params.title} subtitle={params.subtitle} watermark={watermark} />
    case 'dark-code': return <DarkCodeTemplate  title={params.title} code={params.code} language={params.language} watermark={watermark} />
  }
}

export async function GET(req: Request, { params }: { params: Promise<{ template: string }> }) {
  const { template } = await params
  if (!TEMPLATE_IDS.includes(template as TemplateId)) {
    return NextResponse.json({ error: 'unknown_template' }, { status: 404 })
  }

  const url = new URL(req.url)
  const key = url.searchParams.get('key') || req.headers.get('authorization')?.replace('Bearer ', '') || null

  // Anonymous access: allow only for free-tier dev/demo → skip for production; require key always.
  const auth = await authenticateKey(key)
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const quota = await checkQuota(auth.userId, auth.plan)
  if (!quota.ok) return NextResponse.json({ error: 'quota_exceeded', cap: quota.cap, period: quota.period }, { status: 429 })

  const rawParams: Record<string, string> = {}
  url.searchParams.forEach((v, k) => { if (k !== 'key') rawParams[k] = v })
  const parsed = ParamsSchema.safeParse(rawParams)
  if (!parsed.success) return NextResponse.json({ error: 'invalid_params', details: parsed.error.format() }, { status: 400 })

  const element = render(template as TemplateId, parsed.data, auth.watermark)

  // Fire-and-forget usage log
  recordUsage({ userId: auth.userId, apiKeyId: auth.apiKeyId, template, cacheHit: false, status: 200 })

  return new ImageResponse(element, {
    width: 1200,
    height: 630,
    headers: {
      'Cache-Control': 'public, max-age=0, s-maxage=31536000, immutable',
      'Content-Type': 'image/png',
    },
  })
}
```

## Task 6.4 — Quota helper

`src/lib/api/quota.ts`:

```ts
import { createAdminClient } from '@/lib/supabase/admin'
import { PLANS, type Plan } from '@/config/plans'

export async function checkQuota(userId: string, plan: Plan): Promise<
  { ok: true } | { ok: false; cap: number; period: 'month' | 'day' }
> {
  const supabase = createAdminClient()
  const limits = PLANS[plan]

  const startMonth = new Date()
  startMonth.setDate(1); startMonth.setHours(0, 0, 0, 0)

  const { count: monthCount } = await supabase
    .from('usage_events')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', startMonth.toISOString())

  if ((monthCount ?? 0) >= limits.monthlyCap) {
    return { ok: false, cap: limits.monthlyCap, period: 'month' }
  }

  if (limits.dailyCap) {
    const startDay = new Date(); startDay.setHours(0, 0, 0, 0)
    const { count: dayCount } = await supabase
      .from('usage_events')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', startDay.toISOString())

    if ((dayCount ?? 0) >= limits.dailyCap) {
      return { ok: false, cap: limits.dailyCap, period: 'day' }
    }
  }

  return { ok: true }
}

export async function recordUsage(e: {
  userId: string; apiKeyId: string; template: string; cacheHit: boolean; status: number
}): Promise<void> {
  const supabase = createAdminClient()
  await supabase.from('usage_events').insert({
    user_id: e.userId,
    api_key_id: e.apiKeyId,
    template: e.template,
    cache_hit: e.cacheHit,
    status: e.status,
  })
}
```

## Task 6.5 — Verify

```bash
pnpm dev
```

1. Create API key in dashboard (save it).
2. Open in browser: `http://localhost:3000/api/og/article?key=YOUR_KEY&title=Hello+World&subtitle=Testing+OGKit&author=You`
3. Must render PNG 1200×630 with watermark (free tier).
4. Test each of 10 templates.
5. Omit key → must get 401.
6. Run with invalid template → must get 404.

## Task 6.6 — Commit

```bash
git add -A && git commit -m "feat(og): core rendering route + 10 templates + quota" && git push
```

---

# Phase 7 — LemonSqueezy Billing

**Prereq**: Phase 6, LS store approved, variant IDs captured in Phase 1.3.
**Duration**: 4 hours.

**Key differences from Stripe (read before implementing)**:
- LS doesn't have a "create customer first" API. The LS `customer` record is created automatically on successful checkout. We link it back to our `user_id` via **checkout `custom_data`** (arbitrary JSON passed through to webhooks).
- LS uses **variant IDs** (numeric) instead of Stripe price IDs.
- Webhook signature = HMAC-SHA256 of raw body, base64-compared against the `X-Signature` header.
- LS customer portal = the **"My Orders"** page on `ogkit.lemonsqueezy.com` OR per-subscription **update payment method** / **cancel** URLs returned by the API. Simpler than Stripe portal but no unified portal — we build a tiny "Billing" page that deep-links into LS.

## Task 7.1 — LemonSqueezy client wrapper

`src/lib/lemon/client.ts`:

```ts
import { lemonSqueezySetup } from '@lemonsqueezy/lemonsqueezy.js'

export function configureLemon() {
  lemonSqueezySetup({
    apiKey: process.env.LEMON_API_KEY!,
    onError: (error) => {
      console.error('[lemonsqueezy]', error)
    },
  })
}
```

Re-export the SDK functions you need in each route (the SDK is stateless after setup). No need to export a singleton.

## Task 7.2 — Checkout session

`src/app/api/lemon/checkout/route.ts`:

```ts
import { NextResponse } from 'next/server'
import { createCheckout } from '@lemonsqueezy/lemonsqueezy.js'
import { configureLemon } from '@/lib/lemon/client'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const Schema = z.object({ plan: z.enum(['pro', 'scale']) })

export async function POST(req: Request) {
  configureLemon()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const parsed = Schema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 })

  const variantId = parsed.data.plan === 'pro'
    ? process.env.LEMON_VARIANT_PRO_MONTHLY!
    : process.env.LEMON_VARIANT_SCALE_MONTHLY!

  const { data, error } = await createCheckout(
    process.env.LEMON_STORE_ID!,
    variantId,
    {
      checkoutOptions: {
        embed: false,
        media: false,
        logo: true,
      },
      checkoutData: {
        email: user.email!,
        custom: {
          user_id: user.id,        // critical: read in webhook to link back to our user
          plan: parsed.data.plan,
        },
      },
      productOptions: {
        name: parsed.data.plan === 'pro' ? 'OGKit Pro' : 'OGKit Scale',
        redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?upgraded=true`,
        receiptButtonText: 'Go to dashboard',
        receiptLinkUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
      },
    }
  )

  if (error || !data) {
    console.error('[lemon checkout]', error)
    return NextResponse.json({ error: 'checkout_failed' }, { status: 500 })
  }

  return NextResponse.json({ url: data.data.attributes.url })
}
```

**Note**: `data.data.attributes.url` is a hosted LS checkout URL (expires in 24h, single-use). Frontend redirects the browser to it.

## Task 7.3 — Billing management page (replaces Stripe customer portal)

LS doesn't offer a unified customer portal. Instead we render a small self-service page that deep-links to LS.

`src/app/api/lemon/subscription/route.ts` — returns the user's active subscription + LS URLs:

```ts
import { NextResponse } from 'next/server'
import { getSubscription } from '@lemonsqueezy/lemonsqueezy.js'
import { configureLemon } from '@/lib/lemon/client'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  configureLemon()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: sub } = await admin
    .from('subscriptions')
    .select('lemon_subscription_id, plan, status, current_period_end, cancel_at_period_end')
    .eq('user_id', user.id)
    .in('status', ['active', 'trialing', 'past_due', 'paused'])
    .maybeSingle()

  if (!sub) return NextResponse.json({ subscription: null })

  // Fetch live URLs from LS (update_payment_method URL and customer_portal_url rotate)
  const { data: liveSub, error } = await getSubscription(sub.lemon_subscription_id)
  if (error || !liveSub) return NextResponse.json({ subscription: sub })

  return NextResponse.json({
    subscription: {
      ...sub,
      update_payment_method_url: liveSub.data.attributes.urls.update_payment_method,
      customer_portal_url: liveSub.data.attributes.urls.customer_portal,
    },
  })
}
```

`src/app/api/lemon/cancel/route.ts` — cancels at period end:

```ts
import { NextResponse } from 'next/server'
import { cancelSubscription } from '@lemonsqueezy/lemonsqueezy.js'
import { configureLemon } from '@/lib/lemon/client'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST() {
  configureLemon()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: sub } = await admin
    .from('subscriptions')
    .select('lemon_subscription_id')
    .eq('user_id', user.id)
    .in('status', ['active', 'trialing', 'past_due'])
    .maybeSingle()

  if (!sub) return NextResponse.json({ error: 'no_active_subscription' }, { status: 400 })

  const { error } = await cancelSubscription(sub.lemon_subscription_id)
  if (error) return NextResponse.json({ error: 'cancel_failed' }, { status: 500 })

  // Webhook `subscription_updated` will flip cancel_at_period_end in DB; this is just the trigger.
  return NextResponse.json({ ok: true })
}
```

## Task 7.4 — Webhook handler

`src/app/api/lemon/webhook/route.ts`:

```ts
import { NextResponse } from 'next/server'
import crypto from 'node:crypto'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type LemonEvent =
  | 'subscription_created'
  | 'subscription_updated'
  | 'subscription_cancelled'
  | 'subscription_resumed'
  | 'subscription_expired'
  | 'subscription_paused'
  | 'subscription_unpaused'
  | 'subscription_payment_success'
  | 'subscription_payment_failed'
  | 'order_created'

function verifySignature(rawBody: string, signatureHeader: string | null): boolean {
  if (!signatureHeader) return false
  const hmac = crypto.createHmac('sha256', process.env.LEMON_WEBHOOK_SECRET!)
  const digest = hmac.update(rawBody).digest('hex')
  try {
    return crypto.timingSafeEqual(Buffer.from(digest, 'hex'), Buffer.from(signatureHeader, 'hex'))
  } catch {
    return false
  }
}

function planFromVariant(variantId: string): 'pro' | 'scale' {
  return variantId === process.env.LEMON_VARIANT_SCALE_MONTHLY ? 'scale' : 'pro'
}

export async function POST(req: Request) {
  const raw = await req.text()
  const signature = req.headers.get('x-signature')
  if (!verifySignature(raw, signature)) {
    return NextResponse.json({ error: 'invalid_signature' }, { status: 401 })
  }

  const payload = JSON.parse(raw)
  const eventName = payload.meta?.event_name as LemonEvent
  const userId = payload.meta?.custom_data?.user_id as string | undefined
  const attrs = payload.data?.attributes

  if (!userId) {
    // order_created events without subscription context can reach here — ignore safely
    return NextResponse.json({ ok: true, skipped: 'no_user_id' })
  }

  const admin = createAdminClient()

  switch (eventName) {
    case 'subscription_created':
    case 'subscription_updated':
    case 'subscription_resumed':
    case 'subscription_unpaused':
    case 'subscription_payment_success':
    case 'subscription_cancelled':   // cancelled still active until period end
    case 'subscription_paused':
    case 'subscription_expired':
    case 'subscription_payment_failed': {
      const lemonSubscriptionId = String(payload.data.id)
      const variantId = String(attrs.variant_id)
      const plan = planFromVariant(variantId)
      const status: string = attrs.status  // 'active' | 'cancelled' | 'expired' | 'past_due' | 'paused' | 'unpaid' | 'on_trial'
      const isActive = ['active', 'on_trial', 'past_due'].includes(status)

      await admin.from('users').update({
        plan: isActive ? plan : 'free',
        lemon_customer_id: String(attrs.customer_id),
      }).eq('id', userId)

      await admin.from('subscriptions').upsert({
        user_id: userId,
        lemon_subscription_id: lemonSubscriptionId,
        lemon_variant_id: variantId,
        lemon_customer_id: String(attrs.customer_id),
        plan,
        status: status as any,
        current_period_start: attrs.renews_at
          ? new Date(new Date(attrs.renews_at).getTime() - 30 * 86400_000).toISOString()
          : new Date().toISOString(),
        current_period_end: attrs.renews_at ?? attrs.ends_at ?? new Date().toISOString(),
        cancel_at_period_end: !!attrs.cancelled && !attrs.ends_at,
      }, { onConflict: 'lemon_subscription_id' })
      break
    }

    case 'order_created':
      // One-time purchases — not used for OGKit subscriptions. Log and ignore.
      console.log('[lemon] order_created ignored', payload.data.id)
      break
  }

  return NextResponse.json({ ok: true })
}
```

**Gotchas to remember**:
- LS sends a `X-Event-Name` header too — we use the body's `meta.event_name` as ground truth since it's signed.
- `attrs.renews_at` is ISO8601; use it as period end. LS doesn't send `current_period_start` — we derive it or omit (nullable in future migration).
- On `subscription_cancelled` the sub is still **active** until `ends_at`. Do not downgrade user plan yet — that happens on `subscription_expired`.

## Task 7.5 — Webhook endpoint registration

🔴 HUMAN ACTION — Defer until Phase 18 (after prod deploy):
- LS dashboard → Settings → **Webhooks** → Create webhook
- URL: `https://ogkit.dev/api/lemon/webhook`
- Signing secret: paste the value you generated for `LEMON_WEBHOOK_SECRET` in Phase 1.3, Step 4. (Same value must be in both Vercel env and LS webhook config.)
- Events to enable (check all):
  - `order_created`
  - `subscription_created`
  - `subscription_updated`
  - `subscription_cancelled`
  - `subscription_resumed`
  - `subscription_expired`
  - `subscription_paused`
  - `subscription_unpaused`
  - `subscription_payment_success`
  - `subscription_payment_failed`
- Save → LS shows "Test" button; click it → should return 200 from your endpoint.

**For local dev webhook testing**:

LS doesn't have a CLI forwarder like Stripe's. Use **ngrok** or **cloudflared**:

```bash
brew install cloudflared
cloudflared tunnel --url http://localhost:3000
```

Copy the `https://xxxxx.trycloudflare.com` URL → create a **second** webhook in LS pointing to `https://xxxxx.trycloudflare.com/api/lemon/webhook` with the same secret. Delete after testing. (Alternative: use LS **Test mode** — toggle in store settings — which lets you make fake $0 payments with any card.)

## Task 7.6 — Verify

1. Ensure LS store is in **Test mode** (Settings → Test mode → ON). Test mode uses card `4242 4242 4242 4242`, any future date, any CVC.
2. `/pricing` → click "Upgrade to Pro" → LS checkout opens.
3. Complete test checkout → redirected to `/dashboard?upgraded=true`.
4. Check Supabase:
   - `users.plan = 'pro'`
   - `users.lemon_customer_id` populated
   - `subscriptions` row exists with `status = 'active'`.
5. Click "Cancel subscription" in `/dashboard/billing` → webhook fires `subscription_updated` → `cancel_at_period_end = true`.
6. In LS dashboard → Subscriptions → find the test sub → **Force expire** → webhook fires `subscription_expired` → `users.plan` flips back to `'free'`.
7. Turn OFF Test mode before launch.

## Task 7.7 — Commit

```bash
git add -A && git commit -m "feat(billing): LemonSqueezy checkout + subscription management + webhooks" && git push
```

---

# Phase 8 — Landing Page

**Prereq**: Phase 7.
**Duration**: 6 hours.

## Task 8.1 — Marketing layout

`src/app/(marketing)/layout.tsx`:

```tsx
import Link from 'next/link'
import { siteConfig } from '@/config/site'

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <nav className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="font-bold text-lg">{siteConfig.name}</Link>
          <div className="flex items-center gap-6 text-sm">
            <Link href="/pricing">Pricing</Link>
            <Link href="/docs">Docs</Link>
            <Link href="/playground">Playground</Link>
            <Link href="https://github.com/ogkit/ogkit" target="_blank">GitHub</Link>
            <Link href="/login" className="font-medium">Sign in</Link>
          </div>
        </nav>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t py-12 text-sm text-muted-foreground">
        <div className="container mx-auto px-4 grid gap-8 md:grid-cols-4">
          <div>
            <div className="font-semibold text-foreground">{siteConfig.name}</div>
            <p className="mt-2">{siteConfig.tagline}</p>
          </div>
          <div>
            <div className="font-medium text-foreground">Product</div>
            <ul className="mt-2 space-y-1">
              <li><Link href="/pricing">Pricing</Link></li>
              <li><Link href="/docs">Docs</Link></li>
              <li><Link href="/playground">Playground</Link></li>
            </ul>
          </div>
          <div>
            <div className="font-medium text-foreground">Frameworks</div>
            <ul className="mt-2 space-y-1">
              <li><Link href="/for/nextjs">Next.js</Link></li>
              <li><Link href="/for/astro">Astro</Link></li>
              <li><Link href="/for/rails">Rails</Link></li>
              <li><Link href="/for/django">Django</Link></li>
            </ul>
          </div>
          <div>
            <div className="font-medium text-foreground">Company</div>
            <ul className="mt-2 space-y-1">
              <li><Link href="mailto:support@ogkit.dev">Contact</Link></li>
              <li><Link href="/terms">Terms</Link></li>
              <li><Link href="/privacy">Privacy</Link></li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  )
}
```

## Task 8.2 — Home page

`src/app/(marketing)/page.tsx`:

```tsx
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { siteConfig } from '@/config/site'
import { HeroPlayground } from '@/components/marketing/hero-playground'

export default function HomePage() {
  return (
    <>
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
          Dynamic OG images.<br />
          <span className="text-muted-foreground">No deploy. Any framework.</span>
        </h1>
        <p className="mt-6 text-xl text-muted-foreground max-w-2xl mx-auto">
          Generate beautiful Open Graph images with a single URL. Works with Next.js, Astro, Rails, Django, WordPress, and any stack.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Button size="lg" asChild><Link href="/login">Start free</Link></Button>
          <Button size="lg" variant="outline" asChild><Link href="/docs">Read docs</Link></Button>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">100 free images/month · No credit card</p>
      </section>

      <section className="container mx-auto px-4 py-10">
        <HeroPlayground />
      </section>

      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center">One URL. Every framework.</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            ['Next.js', '/for/nextjs'],
            ['Astro', '/for/astro'],
            ['Rails', '/for/rails'],
            ['Django', '/for/django'],
            ['Laravel', '/for/laravel'],
            ['WordPress', '/for/wordpress'],
          ].map(([name, href]) => (
            <Link key={name} href={href} className="rounded-lg border p-6 hover:bg-accent">
              <div className="font-semibold text-lg">{name}</div>
              <div className="text-sm text-muted-foreground mt-1">5-minute integration →</div>
            </Link>
          ))}
        </div>
      </section>
    </>
  )
}
```

## Task 8.3 — Hero playground

`src/components/marketing/hero-playground.tsx`:

```tsx
'use client'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function HeroPlayground() {
  const [title, setTitle] = useState('Your next blog post')
  const [subtitle, setSubtitle] = useState('A short and punchy description')

  const url = `/api/og/article?title=${encodeURIComponent(title)}&subtitle=${encodeURIComponent(subtitle)}&author=OGKit&key=demo`

  return (
    <div className="rounded-xl border bg-card p-6 max-w-4xl mx-auto">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Subtitle</Label>
            <Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
          </div>
          <div className="text-xs font-mono bg-muted p-3 rounded">
            GET {url}
          </div>
        </div>
        <div className="aspect-[1200/630] rounded-lg overflow-hidden border bg-muted">
          <img src={url} alt="preview" className="w-full h-full object-cover" />
        </div>
      </div>
    </div>
  )
}
```

Note: `key=demo` must be handled by agent in Phase 6 route — add anonymous allowance ONLY for `key=demo` with heavy rate limit (Upstash or in-memory), and watermark. Or simpler: create a single real `demo` API key in DB seeded for anonymous demo use, with its own user_id mapped to a hard-coded "demo" account on free tier.

**Decision**: Agent creates a demo user + demo key in Supabase Studio manually (one-time). Uses that key in the playground public URL.

## Task 8.4 — Pricing page

`src/app/(marketing)/pricing/page.tsx`:

```tsx
import { Button } from '@/components/ui/button'
import { PLANS } from '@/config/plans'
import { CheckoutButton } from '@/components/marketing/checkout-button'
import Link from 'next/link'

export default function PricingPage() {
  return (
    <section className="container mx-auto px-4 py-20 max-w-5xl">
      <h1 className="text-4xl font-bold text-center">Simple, usage-based pricing</h1>
      <p className="mt-4 text-center text-muted-foreground">Start free. Upgrade when you're ready.</p>

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {(['free', 'pro', 'scale'] as const).map((id) => {
          const p = PLANS[id]
          return (
            <div key={id} className="rounded-xl border p-8 flex flex-col">
              <div className="font-semibold text-lg">{p.name}</div>
              <div className="mt-2 text-4xl font-bold">
                ${p.priceMonthly}<span className="text-base text-muted-foreground font-normal">/mo</span>
              </div>
              <ul className="mt-6 space-y-2 text-sm flex-1">
                {p.features.map((f) => <li key={f}>✓ {f}</li>)}
              </ul>
              <div className="mt-6">
                {id === 'free' ? (
                  <Button variant="outline" className="w-full" asChild><Link href="/login">Start free</Link></Button>
                ) : (
                  <CheckoutButton plan={id} />
                )}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
```

`src/components/marketing/checkout-button.tsx`:

```tsx
'use client'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

export function CheckoutButton({ plan }: { plan: 'pro' | 'scale' }) {
  const [loading, setLoading] = useState(false)
  async function go() {
    setLoading(true)
    const r = await fetch('/api/lemon/checkout', { method: 'POST', body: JSON.stringify({ plan }) })
    const { url, error } = await r.json()
    if (error === 'unauthorized') { window.location.href = '/login?next=/pricing'; return }
    if (url) window.location.href = url
    setLoading(false)
  }
  return <Button className="w-full" onClick={go} disabled={loading}>{loading ? '...' : `Upgrade to ${plan}`}</Button>
}
```

## Task 8.5 — Commit

```bash
git add -A && git commit -m "feat(marketing): home + pricing pages with playground" && git push
```

---

# Phase 9 — Dashboard

**Prereq**: Phase 8.
**Duration**: 4 hours.

## Task 9.1 — Dashboard layout

`src/app/(app)/layout.tsx`:

```tsx
import Link from 'next/link'
import { signOut } from '@/lib/auth/signout'
import { Button } from '@/components/ui/button'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      <aside className="w-56 border-r p-4 space-y-2">
        <Link href="/" className="block font-bold mb-6">OGKit</Link>
        <Link href="/dashboard" className="block px-2 py-1 rounded hover:bg-accent">Overview</Link>
        <Link href="/dashboard/keys" className="block px-2 py-1 rounded hover:bg-accent">API Keys</Link>
        <Link href="/dashboard/billing" className="block px-2 py-1 rounded hover:bg-accent">Billing</Link>
        <Link href="/playground" className="block px-2 py-1 rounded hover:bg-accent">Playground</Link>
        <Link href="/docs" className="block px-2 py-1 rounded hover:bg-accent">Docs</Link>
        <form action={signOut} className="pt-4">
          <Button variant="ghost" size="sm" type="submit">Sign out</Button>
        </form>
      </aside>
      <main className="flex-1">{children}</main>
    </div>
  )
}
```

## Task 9.2 — Dashboard overview

`src/app/(app)/dashboard/page.tsx`:

```tsx
import { createClient } from '@/lib/supabase/server'
import { PLANS } from '@/config/plans'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: me } = await supabase.from('users').select('plan').eq('id', user.id).single()
  const plan = me?.plan ?? 'free'
  const limits = PLANS[plan as keyof typeof PLANS]

  const startMonth = new Date(); startMonth.setDate(1); startMonth.setHours(0,0,0,0)
  const { count } = await supabase.from('usage_events').select('id', { count: 'exact', head: true })
    .eq('user_id', user.id).gte('created_at', startMonth.toISOString())

  const used = count ?? 0
  const pct = Math.min(100, (used / limits.monthlyCap) * 100)

  return (
    <div className="container max-w-4xl py-8 space-y-6">
      <h1 className="text-2xl font-bold">Overview</h1>
      <Card>
        <CardHeader><CardTitle>This month's usage</CardTitle></CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{used.toLocaleString()} / {limits.monthlyCap.toLocaleString()}</div>
          <div className="mt-2 h-2 rounded bg-muted"><div className="h-2 rounded bg-primary" style={{ width: `${pct}%` }} /></div>
          <div className="mt-2 text-sm text-muted-foreground">Plan: {limits.name}</div>
        </CardContent>
      </Card>
    </div>
  )
}
```

## Task 9.3 — Billing page

`src/app/(app)/dashboard/billing/page.tsx`:

```tsx
'use client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useEffect, useState } from 'react'
import { format } from 'date-fns'

type Subscription = {
  plan: 'pro' | 'scale'
  status: string
  current_period_end: string
  cancel_at_period_end: boolean
  update_payment_method_url?: string
  customer_portal_url?: string
} | null

export default function BillingPage() {
  const [sub, setSub] = useState<Subscription>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/lemon/subscription')
      .then((r) => r.json())
      .then((d) => setSub(d.subscription))
      .finally(() => setLoading(false))
  }, [])

  async function cancel() {
    if (!confirm('Cancel subscription at end of current period?')) return
    setBusy('cancel')
    const r = await fetch('/api/lemon/cancel', { method: 'POST' })
    if (r.ok) window.location.reload()
    else alert('Failed to cancel. Contact support.')
    setBusy(null)
  }

  if (loading) return <div className="container py-8">Loading…</div>

  return (
    <div className="container max-w-4xl py-8 space-y-6">
      <h1 className="text-2xl font-bold">Billing</h1>

      {!sub ? (
        <div className="rounded-lg border p-6 space-y-3">
          <p className="text-muted-foreground">You're on the Free plan.</p>
          <Button asChild><a href="/pricing">Upgrade</a></Button>
        </div>
      ) : (
        <div className="rounded-lg border p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xl font-semibold capitalize">{sub.plan} plan</div>
              <Badge variant={sub.status === 'active' ? 'default' : 'secondary'}>{sub.status}</Badge>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              {sub.cancel_at_period_end ? 'Ends' : 'Renews'} on{' '}
              {format(new Date(sub.current_period_end), 'PPP')}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {sub.update_payment_method_url && (
              <Button asChild variant="outline">
                <a href={sub.update_payment_method_url} target="_blank" rel="noopener">
                  Update payment method
                </a>
              </Button>
            )}
            {sub.customer_portal_url && (
              <Button asChild variant="outline">
                <a href={sub.customer_portal_url} target="_blank" rel="noopener">
                  View invoices
                </a>
              </Button>
            )}
            {!sub.cancel_at_period_end && (
              <Button variant="destructive" onClick={cancel} disabled={busy === 'cancel'}>
                {busy === 'cancel' ? '…' : 'Cancel subscription'}
              </Button>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            Payments are processed by <strong>Lemon Squeezy</strong>, our Merchant of Record.
            Invoices and tax documents are available via the "View invoices" link.
          </p>
        </div>
      )}
    </div>
  )
}
```

## Task 9.4 — Commit

```bash
git add -A && git commit -m "feat(dashboard): overview + keys + billing" && git push
```

---

# Phase 10 — Full Playground

**Prereq**: Phase 9.
**Duration**: 4 hours.

Agent builds `/playground` page with:
- Template selector (dropdown)
- Dynamic form per template (fields driven from `ParamsSchema`)
- Live preview (`<img src={...} />` updating on form change with 300ms debounce)
- Copy URL button
- Copy code snippet button with 3 tabs: `Next.js`, `curl`, `Python`
- Uses user's first active API key

Implementation: `src/app/(app)/playground/page.tsx` + `src/components/playground/playground.tsx`. Agent writes this following the HeroPlayground pattern extended with template selector and code snippets.

Code snippet examples (generated dynamically):

```tsx
// Next.js
export const metadata = {
  openGraph: {
    images: [`https://ogkit.dev/api/og/article?title=${encodeURIComponent(title)}&key=${key}`],
  },
}

// curl
curl "https://ogkit.dev/api/og/article?title=Hello&key=${KEY}" > og.png

// Python
import requests
r = requests.get("https://ogkit.dev/api/og/article", params={"title": "Hello", "key": KEY})
open("og.png","wb").write(r.content)
```

Commit:
```bash
git commit -am "feat(playground): full-featured playground with code snippets" && git push
```

---

# Phase 11 — Docs Site (Fumadocs)

**Prereq**: Phase 10.
**Duration**: 4 hours.

## Task 11.1 — Install Fumadocs

```bash
pnpm add fumadocs-ui fumadocs-core fumadocs-mdx
pnpm add -D @types/mdx
```

## Task 11.2 — Docs structure

Create `content/docs/` with MDX files:

```
content/docs/
├── index.mdx              # Welcome
├── quickstart.mdx         # Quickstart (5-min)
├── templates/
│   ├── index.mdx
│   ├── article.mdx
│   ├── product.mdx
│   └── ... (10 files)
├── integrations/
│   ├── nextjs.mdx
│   ├── astro.mdx
│   ├── rails.mdx
│   ├── django.mdx
│   ├── laravel.mdx
│   ├── wordpress.mdx
│   ├── ghost.mdx
│   └── curl.mdx
├── api-reference.mdx
├── authentication.mdx
├── rate-limits.mdx
└── faq.mdx
```

Each MDX file: 400–1200 words + code examples. Agent generates content using Claude through OpenRouter (agent's own LLM, not user's), following template:

1. What this integration covers
2. Install (if any)
3. Basic example
4. Advanced example
5. Troubleshooting

## Task 11.3 — Fumadocs config

Follow https://fumadocs.vercel.app setup. Set up `/docs` route with sidebar + content.

## Task 11.4 — Commit

```bash
git commit -am "feat(docs): fumadocs site with quickstart + 8 integrations" && git push
```

---

# Phase 12 — Programmatic SEO Pages (46 pages)

**Prereq**: Phase 11.
**Duration**: 8 hours (mostly content generation).

## Task 12.1 — Define page data as JSON

`src/content/frameworks/data.ts`:

```ts
export const FRAMEWORKS = [
  { slug: 'nextjs', name: 'Next.js', codeLang: 'ts', emoji: '▲' },
  { slug: 'nuxt', name: 'Nuxt 3', codeLang: 'ts', emoji: '◆' },
  { slug: 'astro', name: 'Astro', codeLang: 'ts' },
  { slug: 'sveltekit', name: 'SvelteKit', codeLang: 'ts' },
  { slug: 'remix', name: 'Remix', codeLang: 'ts' },
  { slug: 'gatsby', name: 'Gatsby', codeLang: 'ts' },
  { slug: 'rails', name: 'Ruby on Rails', codeLang: 'ruby' },
  { slug: 'django', name: 'Django', codeLang: 'python' },
  { slug: 'laravel', name: 'Laravel', codeLang: 'php' },
  { slug: 'express', name: 'Express', codeLang: 'js' },
  { slug: 'fastify', name: 'Fastify', codeLang: 'js' },
  { slug: 'nestjs', name: 'NestJS', codeLang: 'ts' },
  { slug: 'hugo', name: 'Hugo', codeLang: 'html' },
  { slug: '11ty', name: 'Eleventy', codeLang: 'html' },
  { slug: 'jekyll', name: 'Jekyll', codeLang: 'html' },
  { slug: 'wordpress', name: 'WordPress', codeLang: 'php' },
  { slug: 'ghost', name: 'Ghost', codeLang: 'handlebars' },
  { slug: 'webflow', name: 'Webflow', codeLang: 'html' },
  { slug: 'framer', name: 'Framer', codeLang: 'html' },
  { slug: 'super', name: 'Super.so', codeLang: 'html' },
]

export const USE_CASES = [
  { slug: 'blog-posts', title: 'Blog Posts', template: 'article' },
  { slug: 'product-pages', title: 'Product Pages', template: 'product' },
  { slug: 'podcast-episodes', title: 'Podcast Episodes', template: 'podcast' },
  { slug: 'youtube-thumbnails', title: 'YouTube Thumbnails', template: 'article' },
  { slug: 'job-postings', title: 'Job Postings', template: 'job' },
  { slug: 'events', title: 'Events', template: 'event' },
  { slug: 'newsletter-issues', title: 'Newsletter Issues', template: 'article' },
  { slug: 'documentation', title: 'Documentation', template: 'minimal' },
]

export const PLATFORMS = [
  { slug: 'twitter', name: 'Twitter / X', meta: 'twitter:image' },
  { slug: 'linkedin', name: 'LinkedIn', meta: 'og:image' },
  { slug: 'facebook', name: 'Facebook', meta: 'og:image' },
  { slug: 'slack', name: 'Slack', meta: 'og:image' },
  { slug: 'discord', name: 'Discord', meta: 'og:image' },
  { slug: 'telegram', name: 'Telegram', meta: 'og:image' },
  { slug: 'whatsapp', name: 'WhatsApp', meta: 'og:image' },
  { slug: 'imessage', name: 'iMessage', meta: 'og:image' },
]

export const COMPARISONS = [
  { slug: 'bannerbear', name: 'Bannerbear', ourPrice: 19, theirPrice: 49 },
  { slug: 'placid', name: 'Placid', ourPrice: 19, theirPrice: 19 },
  { slug: 'vercel-og', name: '@vercel/og', ourPrice: 19, theirPrice: 0 },
  { slug: 'htmlcsstoimage', name: 'HTML/CSS to Image', ourPrice: 19, theirPrice: 19 },
  { slug: 'dynapictures', name: 'Dynapictures', ourPrice: 19, theirPrice: 29 },
]
```

## Task 12.2 — Dynamic pages

`src/app/(marketing)/for/[framework]/page.tsx`:

```tsx
import { notFound } from 'next/navigation'
import { FRAMEWORKS } from '@/content/frameworks/data'
import type { Metadata } from 'next'
import { getFrameworkContent } from '@/lib/content/framework'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export async function generateStaticParams() {
  return FRAMEWORKS.map((f) => ({ framework: f.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ framework: string }> }): Promise<Metadata> {
  const { framework } = await params
  const f = FRAMEWORKS.find((x) => x.slug === framework)
  if (!f) return {}
  return {
    title: `OG Image API for ${f.name} — OGKit`,
    description: `Generate dynamic Open Graph images in ${f.name} with a single URL. 100 free per month.`,
    openGraph: {
      images: [`/api/og/article?title=${encodeURIComponent(`OG Images for ${f.name}`)}&subtitle=5-minute integration&key=demo`],
    },
  }
}

export default async function FrameworkPage({ params }: { params: Promise<{ framework: string }> }) {
  const { framework } = await params
  const f = FRAMEWORKS.find((x) => x.slug === framework)
  if (!f) notFound()

  const content = await getFrameworkContent(f)

  return (
    <article className="container max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold">OG Image API for {f.name}</h1>
      <p className="mt-4 text-xl text-muted-foreground">{content.intro}</p>

      <div className="mt-8 flex gap-3">
        <Button asChild><Link href="/login">Start free</Link></Button>
        <Button variant="outline" asChild><Link href="/docs">Read docs</Link></Button>
      </div>

      <section className="mt-12 prose prose-slate max-w-none">
        <h2>Quick start</h2>
        <pre><code>{content.code}</code></pre>
        <h2>Why {f.name} developers pick OGKit</h2>
        <ul>
          {content.bullets.map((b) => <li key={b}>{b}</li>)}
        </ul>
        <h2>Live preview</h2>
        <img src={`/api/og/article?title=${encodeURIComponent(`Built with ${f.name}`)}&subtitle=OGKit&key=demo`} alt="preview" />
        <h2>Pricing</h2>
        <p>Free: 100 images/month with watermark. Pro: $19/month for 50,000 images.</p>
        <Link href="/pricing">See full pricing →</Link>
      </section>
    </article>
  )
}
```

`src/lib/content/framework.ts`:

```ts
import type { FRAMEWORKS } from '@/content/frameworks/data'

type F = typeof FRAMEWORKS[number]

export async function getFrameworkContent(f: F) {
  // Load from local JSON generated offline by agent; static, not AI-runtime
  const content = await import(`@/content/frameworks/${f.slug}.json`).then((m) => m.default)
  return content as {
    intro: string
    code: string
    bullets: string[]
  }
}
```

## Task 12.3 — Generate content for each framework

Agent runs this as a one-time build step (agent uses its own LLM access, not user's OpenRouter):

For each framework in `FRAMEWORKS`, agent generates `src/content/frameworks/{slug}.json` with structure:

```json
{
  "intro": "Short description (~60 words) about using OGKit with {framework}",
  "code": "// Actual working code sample for {framework}, integrating OGKit",
  "bullets": ["reason 1", "reason 2", "reason 3", "reason 4"]
}
```

Each file ~500 words. Agent writes 20 JSON files. Similarly for use-cases (8), platforms (8), comparisons (5).

## Task 12.4 — Repeat for /use-case, /platform, /compare

Follow same pattern: dynamic route + static params + content JSON.

## Task 12.5 — Generate XML sitemap

`src/app/sitemap.ts`:

```ts
import type { MetadataRoute } from 'next'
import { FRAMEWORKS, USE_CASES, PLATFORMS, COMPARISONS } from '@/content/frameworks/data'
import { siteConfig } from '@/config/site'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteConfig.url
  const staticPages = ['', '/pricing', '/docs', '/playground', '/tools/og-preview-checker', '/tools/og-image-generator']
  return [
    ...staticPages.map((p) => ({ url: `${base}${p}`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.8 })),
    ...FRAMEWORKS.map((f) => ({ url: `${base}/for/${f.slug}`, lastModified: new Date(), priority: 0.7 })),
    ...USE_CASES.map((u) => ({ url: `${base}/use-case/${u.slug}`, lastModified: new Date(), priority: 0.6 })),
    ...PLATFORMS.map((p) => ({ url: `${base}/platform/${p.slug}`, lastModified: new Date(), priority: 0.6 })),
    ...COMPARISONS.map((c) => ({ url: `${base}/compare/${c.slug}`, lastModified: new Date(), priority: 0.5 })),
  ]
}
```

`src/app/robots.ts`:

```ts
import type { MetadataRoute } from 'next'
import { siteConfig } from '@/config/site'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/' }],
    sitemap: `${siteConfig.url}/sitemap.xml`,
  }
}
```

## Task 12.6 — Commit

```bash
git commit -am "feat(seo): 46 programmatic landing pages + sitemap" && git push
```

---

# Phase 13 — Free Tools (lead magnets)

**Prereq**: Phase 12.
**Duration**: 4 hours.

## Task 13.1 — `/tools/og-preview-checker`

User pastes URL → tool fetches the page, extracts OG tags, renders preview cards for Twitter/LinkedIn/Facebook/Slack, identifies missing tags.

`src/app/(marketing)/tools/og-preview-checker/page.tsx` + `src/app/api/tools/og-check/route.ts`.

Backend uses `fetch` (no headless browser needed for OG tags — they're in static HTML).

## Task 13.2 — `/tools/og-image-generator`

Free 3/day anonymous generator. Rate limit by IP. Uses same /api/og/ backend with a special anonymous key.

## Task 13.3 — `/tools/twitter-card-validator`

Like og-preview-checker but Twitter-specific: validates card type, required fields.

## Task 13.4 — `/tools/unfurl-tester`

Simulates how Slack/Discord/iMessage would unfurl a URL. Shows preview.

## Task 13.5 — `/tools/meta-tags-generator`

Input: title, description, image, URL, site name. Output: copy-paste HTML with all meta tags (OG + Twitter + schema.org).

Each tool page is a pure-React form + server action, no login required. Every tool has a strong CTA to the main product at the bottom.

## Task 13.6 — Commit

```bash
git commit -am "feat(tools): 5 free lead-magnet tools" && git push
```

---

# Phase 14 — SDK packages

**Prereq**: Phase 13.
**Duration**: 2 hours.

## Task 14.1 — npm package

Create `packages/ogkit-js/` sibling directory:

```
packages/ogkit-js/
├── package.json
├── tsconfig.json
├── README.md
└── src/index.ts
```

`src/index.ts`:

```ts
export type TemplateId = 'article' | 'product' | 'quote' | 'podcast' | 'event' | 'job' | 'minimal' | 'brand' | 'gradient' | 'dark-code'

export interface OGKitOptions {
  apiKey: string
  baseUrl?: string
}

export class OGKit {
  private apiKey: string
  private baseUrl: string

  constructor(opts: OGKitOptions) {
    this.apiKey = opts.apiKey
    this.baseUrl = opts.baseUrl ?? 'https://ogkit.dev'
  }

  url(template: TemplateId, params: Record<string, string>): string {
    const qs = new URLSearchParams({ ...params, key: this.apiKey })
    return `${this.baseUrl}/api/og/${template}?${qs.toString()}`
  }

  async fetch(template: TemplateId, params: Record<string, string>): Promise<Blob> {
    const res = await fetch(this.url(template, params))
    if (!res.ok) throw new Error(`OGKit ${res.status}: ${await res.text()}`)
    return res.blob()
  }
}
```

`package.json`:

```json
{
  "name": "@ogkit/client",
  "version": "0.1.0",
  "description": "OGKit client — dynamic OG image generation",
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "scripts": { "build": "tsup src/index.ts --format cjs,esm --dts" },
  "repository": "github:ogkit/ogkit",
  "license": "MIT"
}
```

🔴 HUMAN ACTION at Phase 18 (after deploy):
- `npm login`
- `cd packages/ogkit-js && pnpm build && npm publish --access public`

## Task 14.2 — Python package

`packages/ogkit-py/`:

```
packages/ogkit-py/
├── pyproject.toml
├── README.md
└── ogkit/
    └── __init__.py
```

```python
from urllib.parse import urlencode
import requests

class OGKit:
    def __init__(self, api_key: str, base_url: str = "https://ogkit.dev"):
        self.api_key = api_key
        self.base_url = base_url

    def url(self, template: str, **params) -> str:
        params["key"] = self.api_key
        return f"{self.base_url}/api/og/{template}?{urlencode(params)}"

    def fetch(self, template: str, **params) -> bytes:
        r = requests.get(self.url(template, **params))
        r.raise_for_status()
        return r.content
```

`pyproject.toml`:

```toml
[project]
name = "ogkit"
version = "0.1.0"
description = "OGKit Python client"
requires-python = ">=3.9"
dependencies = ["requests>=2.30"]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"
```

🔴 HUMAN ACTION: `cd packages/ogkit-py && python -m build && twine upload dist/*`

## Task 14.3 — Commit

```bash
git commit -am "feat(sdk): JS and Python client packages" && git push
```

---

# Phase 15 — Observability & Ops Monitoring (Telegram)

**Prereq**: Phase 14. Telegram bot + chat ID from Phase 1.9.
**Duration**: 2 hours.

**Monitoring philosophy**: Telegram is for **actionable, user-facing business events** (someone signed up, someone paid, someone churned, a webhook failed, quota saturation). Sentry is for **code errors / stack traces**. Don't duplicate. Solo founder's dashboard = Telegram chat. Daily summary keeps you grounded without checking the DB.

## Task 15.1 — Sentry setup

```bash
pnpm dlx @sentry/wizard@latest -i nextjs
```

Use `NEXT_PUBLIC_SENTRY_DSN` from Phase 1.7.

## Task 15.2 — Vercel Analytics

```bash
pnpm add @vercel/analytics
```

Wrap root layout:

```tsx
import { Analytics } from '@vercel/analytics/next'
// inside <body>: <Analytics />
```

## Task 15.3 — Telegram notify module

Create `src/lib/telegram/notify.ts`:

```ts
/**
 * Fire-and-forget Telegram notifier for ops events.
 * - Never throws. Never blocks the caller.
 * - Silent no-op if env vars missing (dev convenience).
 * - Uses Markdown; all dynamic strings go through escapeMd() to prevent parse errors.
 */

const TOKEN = process.env.TELEGRAM_BOT_TOKEN
const CHAT_ID = process.env.TELEGRAM_CHAT_ID

export type OpsEvent =
  | { type: 'user.signed_up'; email: string; userId: string }
  | { type: 'apikey.created'; email: string; keyName: string; keyPrefix: string }
  | { type: 'apikey.revoked'; email: string; keyName: string }
  | { type: 'subscription.created'; email: string; plan: 'pro' | 'scale'; mrrDelta: number }
  | { type: 'subscription.upgraded'; email: string; from: string; to: 'pro' | 'scale'; mrrDelta: number }
  | { type: 'subscription.cancel_scheduled'; email: string; plan: string; endsAt: string }
  | { type: 'subscription.expired'; email: string; plan: string; mrrDelta: number }
  | { type: 'payment.failed'; email: string; plan: string; attempt: number }
  | { type: 'payment.succeeded'; email: string; plan: string; amountUsd: number }
  | { type: 'quota.exceeded'; email: string; plan: string; scope: 'daily' | 'monthly' }
  | { type: 'webhook.invalid_signature'; source: 'lemon'; ip?: string }
  | { type: 'ops.error'; where: string; message: string }
  | { type: 'daily.summary'; data: DailySummary }

export interface DailySummary {
  signupsToday: number
  activeSubs: number
  mrrUsd: number
  imagesToday: number
  imagesYesterday: number
  errors24h: number
  quotaHits24h: number
  newSubsToday: number
  churnedToday: number
}

function escapeMd(s: string | number | null | undefined): string {
  if (s === null || s === undefined) return ''
  return String(s).replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, '\\$&')
}

function render(e: OpsEvent): { text: string; silent?: boolean } {
  switch (e.type) {
    case 'user.signed_up':
      return {
        text: `🎉 *New signup*\n${escapeMd(e.email)}\n\`${escapeMd(e.userId.slice(0, 8))}\``,
      }
    case 'apikey.created':
      return {
        text: `🔑 *API key created*\n${escapeMd(e.email)}\nname: \`${escapeMd(e.keyName)}\`\nprefix: \`${escapeMd(e.keyPrefix)}\``,
        silent: true,
      }
    case 'apikey.revoked':
      return {
        text: `🚫 API key revoked\n${escapeMd(e.email)} \\(${escapeMd(e.keyName)}\\)`,
        silent: true,
      }
    case 'subscription.created':
      return {
        text: `💰 *NEW PAID SUB* \\+$${escapeMd(e.mrrDelta)}/mo\n${escapeMd(e.email)}\nplan: *${escapeMd(e.plan)}*`,
      }
    case 'subscription.upgraded':
      return {
        text: `📈 *Upgrade* ${escapeMd(e.from)} → *${escapeMd(e.to)}* \\(\\+$${escapeMd(e.mrrDelta)}/mo\\)\n${escapeMd(e.email)}`,
      }
    case 'subscription.cancel_scheduled':
      return {
        text: `⚠️ Cancel scheduled\n${escapeMd(e.email)} \\(${escapeMd(e.plan)}\\)\nends: ${escapeMd(e.endsAt)}`,
      }
    case 'subscription.expired':
      return {
        text: `💸 *CHURN* \\-$${escapeMd(e.mrrDelta)}/mo\n${escapeMd(e.email)} was ${escapeMd(e.plan)}`,
      }
    case 'payment.failed':
      return {
        text: `🔴 *Payment failed* \\(attempt ${escapeMd(e.attempt)}\\)\n${escapeMd(e.email)} \\(${escapeMd(e.plan)}\\)`,
      }
    case 'payment.succeeded':
      return {
        text: `✅ Renewal $${escapeMd(e.amountUsd)}\n${escapeMd(e.email)} \\(${escapeMd(e.plan)}\\)`,
        silent: true,
      }
    case 'quota.exceeded':
      return {
        text: `⏱️ Quota hit \\(${escapeMd(e.scope)}\\)\n${escapeMd(e.email)} on ${escapeMd(e.plan)} — potential upgrade`,
        silent: true,
      }
    case 'webhook.invalid_signature':
      return {
        text: `🛡️ *Webhook signature invalid* — ${escapeMd(e.source)}\nip: \`${escapeMd(e.ip ?? 'unknown')}\``,
      }
    case 'ops.error':
      return {
        text: `❗ *Error* in ${escapeMd(e.where)}\n\`\`\`\n${escapeMd(e.message.slice(0, 500))}\n\`\`\``,
      }
    case 'daily.summary': {
      const d = e.data
      const delta = d.imagesToday - d.imagesYesterday
      const arrow = delta >= 0 ? '↑' : '↓'
      return {
        text: [
          `📊 *Daily summary*`,
          ``,
          `👥 Signups today: *${escapeMd(d.signupsToday)}*`,
          `💰 Active subs: *${escapeMd(d.activeSubs)}* \\($${escapeMd(d.mrrUsd)} MRR\\)`,
          `➕ New subs: ${escapeMd(d.newSubsToday)}    ➖ Churn: ${escapeMd(d.churnedToday)}`,
          `🖼️ Images: *${escapeMd(d.imagesToday)}* ${arrow} \\(yday: ${escapeMd(d.imagesYesterday)}\\)`,
          `⏱️ Quota hits 24h: ${escapeMd(d.quotaHits24h)}`,
          `❗ Errors 24h: ${escapeMd(d.errors24h)}`,
        ].join('\n'),
      }
    }
  }
}

export function notifyTelegram(event: OpsEvent): void {
  if (!TOKEN || !CHAT_ID) return
  const { text, silent } = render(event)

  // Fire and forget. Never await. Never throw. Short AbortSignal so a dead Telegram doesn't keep functions warm.
  fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      text,
      parse_mode: 'MarkdownV2',
      disable_notification: silent ?? false,
      disable_web_page_preview: true,
    }),
    signal: AbortSignal.timeout(3000),
  }).catch((err) => {
    console.error('[telegram] notify failed', event.type, err?.message ?? err)
  })
}
```

**Why MarkdownV2 and escapeMd?** MarkdownV2 breaks the whole message if any unescaped special char appears in a dynamic value (email `user.name@x.com` has `.`, a plan `pro` doesn't but better safe). Always route dynamic strings through `escapeMd()`.

**Why `signal: AbortSignal.timeout(3000)`?** Vercel edge / serverless functions bill for wall-clock time. A hanging Telegram request would bloat cost. 3s is generous since Telegram API p99 < 800ms.

## Task 15.4 — Wire event: user signup

In `src/app/(auth)/callback/route.ts`, find the block added in Phase 17.1 (welcome email on first sign-in). **Add the Telegram call alongside it**, using the same "first sign-in" signal (`usage_events` count = 0).

Final block in `callback/route.ts` after a successful `exchangeCodeForSession`:

```ts
import { notifyTelegram } from '@/lib/telegram/notify'

// ... after session exchange, user is authenticated:
const { count } = await supabase
  .from('usage_events')
  .select('id', { count: 'exact', head: true })
  .eq('user_id', user.id)

if ((count ?? 0) === 0) {
  notifyTelegram({ type: 'user.signed_up', email: user.email!, userId: user.id })

  // existing Phase 17.1 welcome email fetch() stays as-is
}
```

Note: `usage_events` count = 0 is a proxy for "never rendered an image", not literally "first sign-in". A user might sign in multiple times before creating a key. For our purposes that's fine — we want one ping per *genuinely new* account, and rendering the first image is a better "this is a real user" signal than just landing on the callback.

If you want strict "first callback" semantics instead, add a nullable `welcomed_at timestamptz` column to `public.users` and flip it in one UPDATE with `returning` to atomically test + set. For MVP, the `usage_events` check is enough.

## Task 15.5 — Wire event: API key created / revoked

In `src/app/api/keys/route.ts` (POST handler), after the INSERT succeeds:

```ts
import { notifyTelegram } from '@/lib/telegram/notify'

// after inserting the new key and returning the plaintext to the user:
notifyTelegram({
  type: 'apikey.created',
  email: user.email!,
  keyName: body.name ?? 'default',
  keyPrefix: prefix, // the 12-char prefix from keys.ts
})
```

In `src/app/api/keys/[id]/route.ts` (DELETE handler), after the UPDATE that sets `revoked_at`:

```ts
notifyTelegram({
  type: 'apikey.revoked',
  email: user.email!,
  keyName: deletedRow?.name ?? 'unknown',
})
```

## Task 15.6 — Wire event: quota exceeded

In `src/lib/api/quota.ts`'s `checkQuota(userId, plan)` function, the branch that returns a 429-type result. Modify to also fire Telegram (dedupe within 10 minutes per user so we don't flood):

```ts
import { notifyTelegram } from '@/lib/telegram/notify'

// in-memory per-instance throttle — best-effort, not cross-region.
// For MVP this is fine; duplicate pings from different regions are rare and not noisy.
const lastPing = new Map<string, number>()
const THROTTLE_MS = 10 * 60 * 1000

function maybeNotifyQuota(email: string, plan: string, scope: 'daily' | 'monthly') {
  const key = `${email}:${scope}`
  const now = Date.now()
  const last = lastPing.get(key)
  if (last && now - last < THROTTLE_MS) return
  lastPing.set(key, now)
  notifyTelegram({ type: 'quota.exceeded', email, plan, scope })
}

// inside checkQuota, when limit breached, fetch user's email once and call maybeNotifyQuota
```

## Task 15.7 — Wire events: LemonSqueezy webhook

In `src/app/api/lemon/webhook/route.ts`:

**a.** Right after the signature verification **fails**:

```ts
if (!verifySignature(raw, signature)) {
  notifyTelegram({
    type: 'webhook.invalid_signature',
    source: 'lemon',
    ip: req.headers.get('x-forwarded-for') ?? undefined,
  })
  return NextResponse.json({ error: 'invalid_signature' }, { status: 401 })
}
```

**b.** Inside the event switch, fetch user email once (needed for all Telegram messages) before the `switch`:

```ts
const { data: userRow } = await admin
  .from('users')
  .select('email, plan')
  .eq('id', userId)
  .single()
const email = userRow?.email ?? 'unknown'
const previousPlan = userRow?.plan ?? 'free'
```

**c.** Fire event per case (add these calls AFTER the DB upsert in each case):

```ts
import { PLANS } from '@/config/plans'

// subscription_created (brand new paid sub)
case 'subscription_created': {
  const price = plan === 'pro' ? PLANS.pro.priceMonthly : PLANS.scale.priceMonthly
  notifyTelegram({ type: 'subscription.created', email, plan, mrrDelta: price })
  break
}

// subscription_updated — detect plan change (upgrade) and schedule-to-cancel
case 'subscription_updated': {
  if (previousPlan !== plan && previousPlan !== 'free') {
    const newPrice = PLANS[plan].priceMonthly
    const oldPrice = PLANS[previousPlan as 'pro' | 'scale']?.priceMonthly ?? 0
    notifyTelegram({
      type: 'subscription.upgraded',
      email,
      from: previousPlan,
      to: plan,
      mrrDelta: newPrice - oldPrice,
    })
  }
  if (attrs.cancelled && attrs.ends_at && status === 'active') {
    notifyTelegram({
      type: 'subscription.cancel_scheduled',
      email,
      plan,
      endsAt: attrs.ends_at,
    })
  }
  break
}

case 'subscription_expired': {
  const lostMrr = PLANS[plan].priceMonthly
  notifyTelegram({ type: 'subscription.expired', email, plan, mrrDelta: lostMrr })
  break
}

case 'subscription_payment_success': {
  const amount = Number(attrs.total ?? PLANS[plan].priceMonthly * 100) / 100
  notifyTelegram({ type: 'payment.succeeded', email, plan, amountUsd: amount })
  break
}

case 'subscription_payment_failed': {
  const attempt = Number(attrs.attempts ?? 1)
  notifyTelegram({ type: 'payment.failed', email, plan, attempt })
  break
}
```

**Important**: these `notifyTelegram` calls go **after** the `admin.from('subscriptions').upsert(...)` — so even if Telegram is down, the DB is already correct.

## Task 15.8 — Daily summary cron

Create `src/app/api/cron/daily-summary/route.ts`:

```ts
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notifyTelegram, type DailySummary } from '@/lib/telegram/notify'
import { PLANS } from '@/config/plans'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const now = new Date()
  const startOfToday = new Date(now); startOfToday.setUTCHours(0, 0, 0, 0)
  const startOfYesterday = new Date(startOfToday.getTime() - 86400_000)

  const [
    { count: signupsToday },
    { count: activeSubs },
    { data: activeSubRows },
    { count: imagesToday },
    { count: imagesYesterday },
    { count: errors24h },
    { count: newSubsToday },
    { count: churnedToday },
  ] = await Promise.all([
    admin.from('users').select('id', { count: 'exact', head: true }).gte('created_at', startOfToday.toISOString()),
    admin.from('subscriptions').select('id', { count: 'exact', head: true }).in('status', ['active', 'on_trial', 'past_due']),
    admin.from('subscriptions').select('plan').in('status', ['active', 'on_trial', 'past_due']),
    admin.from('usage_events').select('id', { count: 'exact', head: true }).gte('created_at', startOfToday.toISOString()),
    admin.from('usage_events').select('id', { count: 'exact', head: true })
      .gte('created_at', startOfYesterday.toISOString())
      .lt('created_at', startOfToday.toISOString()),
    admin.from('usage_events').select('id', { count: 'exact', head: true }).gte('created_at', new Date(now.getTime() - 86400_000).toISOString()).gte('status', 500),
    admin.from('subscriptions').select('id', { count: 'exact', head: true }).gte('created_at', startOfToday.toISOString()).eq('status', 'active'),
    admin.from('subscriptions').select('id', { count: 'exact', head: true }).gte('updated_at', startOfToday.toISOString()).eq('status', 'expired'),
  ])

  const mrrUsd = (activeSubRows ?? []).reduce(
    (sum, s) => sum + (PLANS[s.plan as 'pro' | 'scale']?.priceMonthly ?? 0),
    0,
  )

  // Quota hits = count of usage_events with status 429 in last 24h
  const { count: quotaHits24h } = await admin
    .from('usage_events')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', new Date(now.getTime() - 86400_000).toISOString())
    .eq('status', 429)

  const summary: DailySummary = {
    signupsToday: signupsToday ?? 0,
    activeSubs: activeSubs ?? 0,
    mrrUsd,
    imagesToday: imagesToday ?? 0,
    imagesYesterday: imagesYesterday ?? 0,
    errors24h: errors24h ?? 0,
    quotaHits24h: quotaHits24h ?? 0,
    newSubsToday: newSubsToday ?? 0,
    churnedToday: churnedToday ?? 0,
  }

  notifyTelegram({ type: 'daily.summary', data: summary })
  return NextResponse.json({ ok: true, summary })
}
```

Then add the cron to `vercel.json` (alongside the IndexNow cron from Phase 16):

```json
{
  "crons": [
    { "path": "/api/cron/indexnow", "schedule": "0 3 * * 0" },
    { "path": "/api/cron/daily-summary", "schedule": "0 7 * * *" }
  ]
}
```

This runs daily at **07:00 UTC**. Adjust to your timezone (e.g. `0 6 * * *` = 09:00 Moscow, `0 13 * * *` = 09:00 EST). Vercel cron respects the `CRON_SECRET` via a `Authorization: Bearer ${CRON_SECRET}` header that Vercel injects automatically for scheduled invocations on the Hobby and Pro plans.

## Task 15.9 — Global error hook (optional but recommended)

Add a catch-all error forwarder so uncaught server errors ping Telegram once (not spammy — Sentry still gets the full trace). In `src/app/global-error.tsx`:

```tsx
'use client'
import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])
  return (
    <html>
      <body>
        <h2>Something went wrong</h2>
      </body>
    </html>
  )
}
```

Server-side uncaught errors in Route Handlers: we already have try/catch → log via `notifyTelegram({ type: 'ops.error', where: 'lemon.webhook', message: e.message })` at the top-level catch of webhook and checkout routes. Add one line at the catch of each critical route handler.

## Task 15.10 — Verify

1. `curl http://localhost:3000/api/cron/daily-summary` without auth → 401.
2. `curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/daily-summary` → 200 and Telegram gets "Daily summary" message with zero counts.
3. Sign in with a fresh email → "New signup" ping arrives.
4. Create an API key → "API key created" ping arrives (silent, no sound).
5. (After Phase 7 test-mode checkout) → "NEW PAID SUB +$19/mo" ping arrives.
6. Send a bogus webhook: `curl -X POST http://localhost:3000/api/lemon/webhook -H "x-signature: 00" -d 'fake'` → "Webhook signature invalid" ping arrives.
7. Hit `/api/og/article` 11 times on a free-tier key within 1 day → "Quota hit (daily)" ping arrives once (not 11 times — throttled).

## Task 15.11 — Commit

```bash
git add -A && git commit -m "feat(obs): Sentry + Analytics + Telegram ops monitoring (signups, payments, churn, errors, daily summary)" && git push
```

---

# Phase 16 — IndexNow + Google Search Console

**Prereq**: Phase 15.
**Duration**: 30 min.

## Task 16.1 — IndexNow key file

Create `public/{INDEXNOW_KEY}.txt` containing just the `INDEXNOW_KEY` value.

## Task 16.2 — Ping IndexNow on deploy

Create `src/app/api/cron/indexnow/route.ts`:

```ts
import { NextResponse } from 'next/server'
import { siteConfig } from '@/config/site'
import { FRAMEWORKS, USE_CASES, PLATFORMS, COMPARISONS } from '@/content/frameworks/data'

export async function GET(req: Request) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const urls = [
    `${siteConfig.url}/`,
    `${siteConfig.url}/pricing`,
    `${siteConfig.url}/docs`,
    ...FRAMEWORKS.map((f) => `${siteConfig.url}/for/${f.slug}`),
    ...USE_CASES.map((u) => `${siteConfig.url}/use-case/${u.slug}`),
    ...PLATFORMS.map((p) => `${siteConfig.url}/platform/${p.slug}`),
    ...COMPARISONS.map((c) => `${siteConfig.url}/compare/${c.slug}`),
  ]

  await fetch('https://api.indexnow.org/IndexNow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      host: 'ogkit.dev',
      key: process.env.INDEXNOW_KEY,
      keyLocation: `${siteConfig.url}/${process.env.INDEXNOW_KEY}.txt`,
      urlList: urls,
    }),
  })

  return NextResponse.json({ submitted: urls.length })
}
```

`vercel.json` (merged with Phase 15.8 daily-summary cron — final list):

```json
{
  "crons": [
    { "path": "/api/cron/indexnow", "schedule": "0 3 * * 0" },
    { "path": "/api/cron/daily-summary", "schedule": "0 7 * * *" }
  ]
}
```

## Task 16.3 — Google Search Console

🔴 HUMAN ACTION (after Phase 18 deploy):
- Verify `ogkit.dev` at https://search.google.com/search-console
- Submit sitemap: `https://ogkit.dev/sitemap.xml`

## Task 16.4 — Commit

```bash
git commit -am "feat(seo): IndexNow integration + weekly cron" && git push
```

---

# Phase 17 — Resend Transactional Emails

**Prereq**: Phase 16.
**Duration**: 1 hour.

## Task 17.1 — Welcome email on signup

Hook: Supabase auth trigger from Phase 3.2 already creates the user row. Additionally, extend it to send a welcome email via Resend using a database webhook → Vercel function, OR simpler: call Resend directly in auth callback after first sign-in.

Agent adds to `src/app/(auth)/callback/route.ts` after successful exchange:

```ts
// if first-ever session, send welcome
const { count } = await supabase.from('usage_events').select('id', { count: 'exact', head: true }).eq('user_id', user.id)
if ((count ?? 0) === 0) {
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'OGKit <hello@ogkit.dev>',
      to: user.email,
      subject: 'Welcome to OGKit',
      html: '<p>Thanks for joining OGKit. Your first API key is one click away: <a href="https://ogkit.dev/dashboard/keys">Create your key</a>.</p>',
    }),
  }).catch(() => {})
}
```

## Task 17.2 — Commit

```bash
git commit -am "feat(email): welcome email on first sign-in" && git push
```

---

# Phase 18 — Production Deployment

**Prereq**: Phase 17.
**Duration**: 1 hour.

## Task 18.1 — Vercel env vars

🔴 HUMAN ACTION
Vercel Dashboard → ogkit project → Settings → Environment Variables. Add all from `.env.local` EXCEPT the localhost URLs:
- `NEXT_PUBLIC_APP_URL=https://ogkit.dev`
- `NEXT_PUBLIC_SITE_URL=https://ogkit.dev`

**Critical** — double-check these are present (easy to miss, silently breaks features):
- `LEMON_API_KEY`, `LEMON_STORE_ID`, `LEMON_WEBHOOK_SECRET`, `LEMON_VARIANT_PRO_MONTHLY`, `LEMON_VARIANT_SCALE_MONTHLY` → billing
- `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` → ops pings (silent failure if missing)
- `CRON_SECRET` → daily-summary cron auth
- `RESEND_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SENTRY_AUTH_TOKEN`

## Task 18.2 — Custom domain

🔴 HUMAN ACTION
Vercel → Settings → Domains → add `ogkit.dev` and `www.ogkit.dev`. Configure DNS at registrar.

## Task 18.3 — Deploy

```bash
git push origin main
```

Vercel auto-deploys. Watch logs.

## Task 18.4 — Smoke test production

- `https://ogkit.dev` loads
- `https://ogkit.dev/login` works, email arrives
- `https://ogkit.dev/api/og/article?key=demo&title=Hello` returns valid PNG
- `https://ogkit.dev/pricing` shows 3 tiers
- `https://ogkit.dev/sitemap.xml` returns valid XML

## Task 18.5 — Register LemonSqueezy webhook in prod

🔴 HUMAN ACTION
1. LS dashboard → Settings → **Webhooks** → Create webhook.
2. URL: `https://ogkit.dev/api/lemon/webhook`
3. Signing secret: paste the `LEMON_WEBHOOK_SECRET` value you generated in Phase 1.3 Step 4. Must match exactly what's in Vercel env vars.
4. Check all 10 events listed in Task 7.5.
5. Save → LS fires a test event → confirm 200 response in Vercel logs.
6. **Turn OFF Test mode** in LS store settings (Settings → Test mode → OFF) so real payments are accepted.
7. Go to `https://ogkit.dev/pricing`, do one **real** $1 test purchase on your own card, verify webhook → DB sync, then refund yourself from LS dashboard (LS allows full refunds within 60 days at no fee).

## Task 18.6 — Commit & tag

```bash
git tag v0.1.0-mvp && git push --tags
```

---

# Phase 19 — GitHub Repo Polish

**Prereq**: Phase 18.
**Duration**: 1 hour.

## Task 19.1 — README

Rewrite root `README.md` as landing:

```md
# OGKit — OG image API for every framework

> Generate beautiful Open Graph images with a single URL.

![screenshot](https://ogkit.dev/api/og/article?title=OGKit&subtitle=OG%20image%20API&key=demo)

## Quick start

```bash
npm install @ogkit/client
```

```ts
import { OGKit } from '@ogkit/client'
const og = new OGKit({ apiKey: process.env.OGKIT_KEY! })
const url = og.url('article', { title: 'Hello world', subtitle: 'OGKit rocks' })
```

## Why OGKit

- **Works with any framework** — Next.js, Astro, Rails, Django, Laravel, WordPress
- **One URL, no deploy** — no `@vercel/og` lock-in
- **$19/mo Pro** — Bannerbear for $49 → OGKit for $19
- **100 free images/month** — no credit card

## Docs

https://ogkit.dev/docs

## License

MIT
```

## Task 19.2 — LICENSE

Standard MIT file. Copyright holder: human's name + year.

## Task 19.3 — Issue templates

`.github/ISSUE_TEMPLATE/bug.md`, `.github/ISSUE_TEMPLATE/feature.md`.

## Task 19.4 — Commit

```bash
git commit -am "docs: README as landing + LICENSE + issue templates" && git push
```

---

# Phase 20 — Launch Day (Day 13–14)

**Prereq**: Phase 19.
**Duration**: 6 hours (human + agent).

## Task 20.1 — Load test

```bash
pnpm dlx artillery quick --count 50 -n 20 "https://ogkit.dev/api/og/article?key={REAL_KEY}&title=Test"
```

Expected: p95 < 800ms on edge.

## Task 20.2 — Directory submissions (20 listings)

🔴 HUMAN ACTION — spreadsheet of 20 one-click submissions:

| Directory | URL |
|---|---|
| Product Hunt | https://producthunt.com (submit launch scheduled) |
| BetaList | https://betalist.com/submit |
| SaaSHub | https://saashub.com/submit |
| AlternativeTo | https://alternativeto.net |
| Slant | https://slant.co |
| G2 | https://g2.com (requires employee) |
| Capterra | https://capterra.com (requires employee) |
| StackShare | https://stackshare.io |
| ToolHunt | https://toolhunt.com |
| Toolify.ai | https://toolify.ai |
| ThereIsAnAIForThat | https://theresanaiforthat.com |
| RapidAPI | https://rapidapi.com/studio |
| Pipedream | https://pipedream.com/apps |
| dev.to Tools | https://dev.to (submit post) |
| Hacker News Show HN | https://news.ycombinator.com/submit |
| IndieHackers | https://indiehackers.com/product/ogkit |
| SaaSWorthy | https://saasworthy.com |
| Pinterest pin | https://pinterest.com (visual value) |
| r/SideProject weekly thread | https://reddit.com/r/SideProject |
| SaaSMag / MicroAcquire listing | https://acquire.com |

## Task 20.3 — Awesome-list PRs (10)

🔴 HUMAN ACTION — 10 PRs, one sentence each:

1. `awesome-nextjs` (https://github.com/unicodeveloper/awesome-nextjs)
2. `awesome-astro` (https://github.com/one-aalam/awesome-astro)
3. `awesome-rails` (https://github.com/gramantin/awesome-rails)
4. `awesome-django` (https://github.com/wsvincent/awesome-django)
5. `awesome-laravel` (https://github.com/chiraggude/awesome-laravel)
6. `awesome-vue` (https://github.com/vuejs/awesome-vue)
7. `awesome-svelte` (https://github.com/rocketlaunchr/awesome-svelte)
8. `awesome-seo` (https://github.com/marcobiedermann/search-engine-optimization)
9. `awesome-social-media` (https://github.com/topics/awesome-social-media)
10. `awesome-wordpress` (https://github.com/miziomon/awesome-wordpress)

Each PR adds one line: `- [OGKit](https://ogkit.dev) — OG image API for {framework}.`

## Task 20.4 — Show HN post

Draft:

> **Show HN: OGKit — OG Image API that works with any framework ($9/mo)**
>
> I got tired of seeing `@vercel/og` tutorials that only work on Next.js on Vercel. OGKit is a hosted OG image API that works with any stack — one URL, any language.
>
> Free tier: 100 images/month with a small watermark. Pro: $19/month for 50k images, no watermark. Built on Next.js + Satori, deployed on Vercel edge.
>
> Would love feedback — especially on pricing vs Bannerbear ($49) and Placid ($19). The pitch is: no deploy, no Vercel lock-in, same power.
>
> https://ogkit.dev

## Task 20.5 — Reddit posts (5)

Each post: tailored one-liner, honest framing.

- `/r/webdev` — "I built an OG image API that works with any framework — free tier, no Vercel lock-in"
- `/r/nextjs` — "I built an OG image API alternative to @vercel/og — free if you're on Vercel, use mine if you're not"
- `/r/astro` — "OG image API for Astro — 5-min integration"
- `/r/rubyonrails` — "OG image API for Rails — generate social cards in Ruby"
- `/r/django` — "OG image API for Django — no headless Chrome needed"

## Task 20.6 — Twitter thread

3–5 tweets. First tweet = hook + preview image. Last = link + CTA.

## Task 20.7 — Monitor launch day

- Sentry open in tab
- Supabase dashboard for new signups
- LemonSqueezy dashboard for conversions
- Reply to every HN/Reddit comment within 15 min

---

# Phase 21 — Post-Launch Maintenance (low burden)

**Duration**: 2–4 hours per month forever.

## Monthly
- One tutorial post in `/docs/blog/` (~800 words). Examples:
  - "How we generate 10,000 OG images for programmatic SEO sites"
  - "Dynamic OG images in {framework} — full guide"
  - "{problem} — {solution with OGKit}"

## Quarterly
- Add 1–2 new framework pages if a new hot framework appears.
- Update `/compare/*` pages with current competitor pricing.
- Review Sentry errors → fix top 3.
- Review LemonSqueezy churn (Subscriptions → filter `cancelled` / `expired`) → reach out to churned users via Resend (1 email).

## As needed (rare)
- New template if top 10 users all request it (not before).
- Bug fixes (should be <2/month after Phase 6 hardening).

## Never
- Do NOT add teams, orgs, seats, SAML, custom domains, or enterprise features until $10k MRR.

---

# Appendix A — Verification Checklist (final pre-launch)

Run through this list before Phase 20. Every box must be checked.

**Product**
- [ ] Sign in with magic link works end-to-end
- [ ] User can create an API key
- [ ] User can revoke an API key
- [ ] All 10 templates render correctly with all their params
- [ ] Free tier shows watermark; Pro does not
- [ ] Free tier gets 429 at 101st monthly request
- [ ] Free tier gets 429 at 11th daily request
- [ ] LemonSqueezy checkout → `subscription_created` webhook → `users.plan` updated
- [ ] Cancel from `/dashboard/billing` → `subscription_updated` → `cancel_at_period_end=true`
- [ ] Force-expire in LS dashboard → `subscription_expired` → `users.plan='free'`
- [ ] Webhook signature verification rejects requests with wrong `X-Signature`

**Telegram ops monitoring**
- [ ] New signup fires `🎉 New signup` ping
- [ ] API key create fires `🔑 API key created` ping (silent)
- [ ] Test checkout fires `💰 NEW PAID SUB` ping
- [ ] Invalid webhook signature fires `🛡️ Webhook signature invalid` ping
- [ ] Quota overflow fires `⏱️ Quota hit` ping (only once per 10 min per user)
- [ ] Daily summary cron delivers `📊 Daily summary` at 07:00 UTC
- [ ] Silent no-op when `TELEGRAM_*` env vars are unset (local dev convenience)
- [ ] Invalid API key returns 401
- [ ] Invalid template returns 404
- [ ] Invalid params return 400 with details

**SEO**
- [ ] `/sitemap.xml` lists 50+ URLs
- [ ] `/robots.txt` references sitemap
- [ ] Each `/for/{framework}` has unique title/description/OG
- [ ] Home page has `<title>` and `<meta description>`
- [ ] All pages have OG meta tags pointing to own API
- [ ] Google Search Console property verified
- [ ] IndexNow key file accessible at `/{key}.txt`

**Performance**
- [ ] p95 edge render < 800ms
- [ ] Cache headers present on `/api/og/*`
- [ ] Home page Lighthouse score > 90

**Security**
- [ ] Service role key never exposed to client (grep `SERVICE_ROLE_KEY` in dist)
- [ ] API key salt not committed
- [ ] `.env.local` in `.gitignore`
- [ ] RLS policies tested (user A cannot read user B's keys)

**Launch assets**
- [ ] GitHub repo public with README
- [ ] npm package `@ogkit/client` published
- [ ] Python package `ogkit` published to PyPI
- [ ] Show HN draft approved by human
- [ ] 5 Reddit post drafts approved
- [ ] 20 directory submissions scheduled
- [ ] 10 awesome-list PRs drafted

---

# Appendix B — Troubleshooting

## "Satori cannot find font"
- Ensure Inter font is loaded via `@vercel/og`'s built-in set or provided as buffer.
- All templates must specify `fontFamily: 'Inter'` inline.

## "Supabase RLS blocks my query"
- Admin operations must use `createAdminClient()` (service role).
- Client-side queries use `createClient()` (anon key) and are scoped by RLS.

## "LemonSqueezy webhook signature invalid" (401)
- `LEMON_WEBHOOK_SECRET` in Vercel env MUST match the value pasted in LS → Settings → Webhooks → your endpoint → Signing secret. Any whitespace/newline difference = mismatch.
- Verify you're comparing against `X-Signature` header (lowercase `x-signature` in Node/Fetch). LS also sends `X-Event-Name` but that's not the signature.
- The HMAC is computed over the **raw request body** — never parse JSON before verifying. Always `await req.text()` first.

## "Webhook returns 200 but DB not updated"
- Check `meta.custom_data.user_id` is present in payload. If missing, customer checked out without our `checkoutData.custom` (e.g. via a public LS checkout URL). Only send customers to checkout via `/api/lemon/checkout`.
- Check Vercel function logs for the webhook route — the switch statement may hit an unhandled event.

## "Checkout redirects to LS but no subscription after payment"
- LS has a ~5–30 second delay between successful payment and webhook delivery. `/dashboard?upgraded=true` may show stale `plan=free` briefly. Add a refresh or poll if it matters.
- In Test mode: ensure you used card `4242 4242 4242 4242`. Other test cards LS supports: see LS docs → Test mode.

## "LS API returns 401 Unauthorized"
- `LEMON_API_KEY` is wrong or expired. Regenerate in LS → Settings → API and update Vercel env + redeploy.
- Ensure `Authorization: Bearer ${key}` header (the SDK handles this automatically once `lemonSqueezySetup` is called).

## "Telegram pings not arriving"
- Send a manual test: `curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" -d chat_id="${TELEGRAM_CHAT_ID}" -d text=test`. If `ok:false` → fix credentials first.
- Channel case: if you migrated from private chat to a channel, the `TELEGRAM_CHAT_ID` changes (negative, starts with `-100`). Bot must be channel admin with **Post Messages** permission.
- Check Vercel logs for `[telegram] notify failed` — the notifier logs but never throws.
- `parse_mode: MarkdownV2` will reject messages containing unescaped specials (`.`, `-`, `_`, etc). All our rendered messages route dynamic values through `escapeMd()`; if you add a new event type, do the same.

## "Daily summary cron fires multiple times / doesn't fire"
- Vercel cron only runs in production on the main branch deployment. Previews don't run crons.
- Confirm `vercel.json` was committed and deployed. `vercel --prod` then check `vercel crons ls`.
- Cron timezone is **UTC** always. Convert your local time.
- Cron jobs must return within 60s (Hobby) / 900s (Pro). Daily summary should finish in <2s with modest data.

## "Telegram floods with quota.exceeded pings"
- The in-memory `Map` throttle in `quota.ts` is per-instance. On Vercel with many concurrent invocations this is best-effort only. If flooding becomes real: move the throttle to Supabase (upsert a row with `next_ping_at` and check it) or to Upstash Redis. Not worth it pre-$1k MRR.

## "Magic link email not arriving"
- Check Supabase → Auth → Logs.
- Default Supabase SMTP is rate-limited. Configure Resend as custom SMTP at Supabase → Auth → SMTP.

## "Image returns 500"
- Check Vercel function logs for the template route.
- Most common: template prop type mismatch. Check Zod schema.

## "Quota check too slow"
- If `count` queries exceed 100ms, add Redis cache (Upstash free tier) keyed on `user_id+month`.
- Not needed for MVP.

---

# Appendix C — Decision Log

Every frozen decision and why. Reference if re-evaluating.

| Decision | Why |
|---|---|
| Next.js 14 App Router | Edge runtime for cheap OG rendering. User's existing stack. |
| Supabase over Firebase | Postgres + RLS fits DB schema; cheaper at scale. |
| LemonSqueezy over Stripe | Merchant of Record: LS handles EU VAT / US sales tax / 1099-K automatically. No US LLC or Stripe Atlas needed for solo founder outside US. Higher fee (~5%+$0.50 vs 2.9%+$0.30) is worth the zero tax-compliance burden. Trade-off: no metered/usage billing (we use flat tiers anyway) and no unified customer portal (we build a small self-service page that deep-links into LS). |
| Satori over Puppeteer | Edge runtime, no Chrome, 100x cheaper per image. |
| Magic link auth | No password reset support burden. |
| `ogk_live_` prefix | Standard format (like `sk_live_`), ~20% faster prefix lookup than full-key. |
| 1200×630 size | Twitter/LinkedIn/Facebook standard. No param to change. |
| No teams/orgs in MVP | Pre-$10k MRR, single-user is enough. Adds 40+ hours of dev + 10/hr/mo support. |
| Fumadocs over Nextra | Better App Router support in 2026. |
| pnpm | Faster installs + smaller node_modules. |
| Vercel over self-host | $0 until traffic significant; edge compute pricing. |

---

# End of plan.

**Agent note:** If any phase cannot complete (external service down, missing secret, etc.), STOP and report the exact failure to human. Do not invent workarounds. Do not skip verification. Ship when every box in Appendix A is checked.
