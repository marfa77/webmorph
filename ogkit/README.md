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

## Deploy (GitHub → Vercel → [www.webmorp.art/ogkit](https://www.webmorp.art/ogkit))

**Canonical GitHub for this product line on webmorp.art:** **[github.com/marfa77/webmorph](https://github.com/marfa77/webmorph)**. Same value is in `src/config/site.ts` (`github` URL).

**Source control:** you push to that repo; Vercel builds from it. Typical setup: `main` → **Production**; PRs → **Preview**.

The app is built to be served under the **`/ogkit` path** on **`www.webmorp.art`** (see `next.config.mjs` + `config/paths.ts`).

1. **Repo layout** — in the **`marfa77/webmorph`** monorepo this app lives in **`ogkit/`**. Set Vercel **Settings → General → Root Directory = `ogkit`** (required). Otherwise `npm install` / `.next` run in the wrong place (`ENOENT`, missing `routes-manifest.json`). If you import a repo that is **only** this app at the repository root, leave Root Directory empty.
2. **Vercel** — **Add New Project** → **Import** that GitHub repo → **Framework: Next.js**, **Install:** `pnpm install` (or auto-detect pnpm from lockfile), **Build:** `pnpm run build` (default).
3. **Environment variables (Production)** — copy from `.env.example` and set at least:

   - `NEXT_PUBLIC_BASE_PATH=/ogkit`
   - `NEXT_PUBLIC_APP_URL=https://www.webmorp.art/ogkit`
   - `NEXT_PUBLIC_SITE_URL=https://www.webmorp.art/ogkit`
   - `NEXT_PUBLIC_SITE_HOST=www.webmorp.art`
   - Supabase: `NEXT_PUBLIC_SUPABASE_*`, `SUPABASE_SERVICE_ROLE_KEY`
   - `API_KEY_SALT`  
   - Optional: Lemon, Cryptomus, Telegram, crons, etc.

4. **Custom domain** — `www.webmorp.art` / `webmorp.art` is often attached to a **parent** Vercel project; this Next app may be a **separate** project and exposed at `/ogkit` via **rewrites**, or the same project serves multiple routes. Use the **`https://www.webmorp.art/ogkit`** base in env and **Supabase Auth redirect URLs**, so links and `callback` match production.
5. **Redeploy** after changing env. **Crons** are defined in `vercel.json` (paths are relative to `basePath`; the app rewrites them internally).

**Cryptomus webhook (if used):** `https://www.webmorp.art/ogkit/api/billing/cryptomus/webhook` — add the same in the Cryptomus dashboard.

**Remote + push** (from a clone where this app is the working tree; adjust branch if needed):

```bash
git remote add origin git@github.com:marfa77/webmorph.git   # or: git remote set-url origin …
git push -u origin main
```

Or: `./scripts/git-push-ssh.sh marfa77/webmorph`

**404 on `webmorph.art/ogkit` with GitHub Pages?** Pages only serves static files from the repo — there is no built Next app there. See **`docs/deploy-webmorp-art.md`**.

## License

MIT (add `LICENSE` if you ship publicly)
