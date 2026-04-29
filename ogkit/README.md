# OGKit

Open Graph (1200×630) image API: one URL per image, 10 templates, API keys, quota, and a browser Playground. **Lemon (billing) is optional** — the product is complete with Supabase auth, free tier, and a Pro/Scale **waitlist** until checkout env is configured.

## Stack

Next.js 14 (App Router), Tailwind, shadcn/ui, Supabase (auth + Postgres), Vercel OG / Satori for PNG rendering.

## Develop

```bash
cd ogkit
pnpm install
cp .env.example .env.local
# Set at minimum: NEXT_PUBLIC_SUPABASE_*, SUPABASE_SERVICE_ROLE_KEY, API_KEY_SALT
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). See **[/docs](http://localhost:3000/docs)** for the HTTP API. **Lemon** variables in `.env.example` are only needed for self-serve paid checkout.

## Product surface

| Area            | Path              |
|-----------------|-------------------|
| API reference   | `/docs`           |
| Playground      | `/playground`     |
| API keys        | `/dashboard/keys` (after sign-in) |
| Pricing         | `/pricing` (waitlist if no Lemon) |
| Account         | `/account`        |

## Deploy (GitHub → Vercel → [webmorp.art](https://webmorp.art))

**Canonical GitHub for this product line on webmorp.art:** **[github.com/marfa77/webmorph](https://github.com/marfa77/webmorph)**. Same value is in `src/config/site.ts` (`github` URL).

**Source control:** you push to that repo; Vercel builds from it. Typical setup: `main` → **Production**; PRs → **Preview**.

**Single deployment, one Vercel project, one domain:** the Next.js app under **`ogkit/`** owns the site root and serves OGKit at **`/`**.

1. **Repo layout** — in **`marfa77/webmorph`** the app lives in **`ogkit/`**. Set Vercel **Settings → General → Root Directory = `ogkit`**, **Framework: Next.js**. This is required so the install/build run in `ogkit` (avoids `ENOENT` on `package.json` and `routes-manifest.json` issues). If the repository is **only** this app with files at the repo root, you can leave Root Directory empty.
2. **Vercel** — import the GitHub repo → **Framework: Next.js**, **Install** / **Build** from `ogkit` (e.g. `pnpm install` + `pnpm run build`).
3. **Environment variables (Production)** — copy from `.env.example` and set at least:

   - `NEXT_PUBLIC_BASE_PATH=`
   - `NEXT_PUBLIC_APP_URL=https://www.webmorp.art`
   - `NEXT_PUBLIC_SITE_URL=https://www.webmorp.art`
   - `NEXT_PUBLIC_SITE_HOST=www.webmorp.art`
   - Supabase: `NEXT_PUBLIC_SUPABASE_*`, `SUPABASE_SERVICE_ROLE_KEY`
   - `API_KEY_SALT`  
   - Telegram: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`
   - Optional: Lemon, Cryptomus, crons, etc.

4. **Custom domain** — attach `webmorp.art` and `www.webmorp.art` to **this** project; set apex → `www` redirect in Vercel so the canonical host matches `site.ts`. Use `https://www.webmorp.art/callback` in **Supabase Auth → Redirect URLs** (add apex too if you keep both hosts).
5. **Redeploy** after changing env. **Crons** in `vercel.json` use root paths, e.g. `/api/cron/...`.

**Cryptomus webhook (if used):** `https://www.webmorp.art/api/billing/cryptomus/webhook` — add the same URL in the Cryptomus project / webhook settings.

## Funnel analytics

Apply Supabase migrations before deploying funnel tracking changes:

```bash
cd ogkit
npx supabase db push
```

If the CLI is not linked or direct Postgres is unreachable, run the SQL from `supabase/migrations/20250424140000_funnel_events.sql` in the Supabase Dashboard SQL Editor. The `funnel_events` table is the source of truth for activation and sales analysis; Telegram is only the live notification channel.

**Remote + push** (from a clone where this app is the working tree; adjust branch if needed):

```bash
git remote add origin git@github.com:marfa77/webmorph.git   # or: git remote set-url origin …
git push -u origin main
```

Or: `./scripts/git-push-ssh.sh marfa77/webmorph`

**404 on `webmorph.art/ogkit` with GitHub Pages?** Pages only serves static files from the repo — there is no built Next app there. See **`docs/deploy-webmorp-art.md`**.

## License

MIT (add `LICENSE` if you ship publicly)
