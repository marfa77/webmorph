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

**Single deployment, one Vercel project, one domain:** the same Next.js app under **`ogkit/`** serves the static **webmorp** landing at **`/`** and **OGKit** at **`/ogkit/`** (see `middleware.ts`, `config/paths.ts`, and `scripts/copy-webmorph-assets.mjs` — `prebuild` copies the repo-root landing and assets into `public/`, and middleware rewrites `/ogkit/*` to the internal app routes). You do **not** need a second Vercel project or cross-project rewrites.

1. **Repo layout** — in **`marfa77/webmorph`** the app lives in **`ogkit/`**. Set Vercel **Settings → General → Root Directory = `ogkit`**, **Framework: Next.js**. This is required so the install/build run in `ogkit` (avoids `ENOENT` on `package.json` and `routes-manifest.json` issues). If the repository is **only** this app with files at the repo root, you can leave Root Directory empty.
2. **Vercel** — import the GitHub repo → **Framework: Next.js**, **Install** / **Build** from `ogkit` (e.g. `pnpm install` + `pnpm run build`).
3. **Environment variables (Production)** — copy from `.env.example` and set at least:

   - `NEXT_PUBLIC_BASE_PATH=/ogkit`
   - `NEXT_PUBLIC_APP_URL=https://www.webmorp.art/ogkit`
   - `NEXT_PUBLIC_SITE_URL=https://www.webmorp.art/ogkit`
   - `NEXT_PUBLIC_SITE_HOST=www.webmorp.art`
   - Supabase: `NEXT_PUBLIC_SUPABASE_*`, `SUPABASE_SERVICE_ROLE_KEY`
   - `API_KEY_SALT`  
   - Optional: Lemon, Cryptomus, Telegram, crons, etc.

4. **Custom domain** — attach `www.webmorph.art` (and `webmorph.art` if you use a redirect) to **this** project. Use the **`https://www.webmorph.art/ogkit`** base in env and **Supabase Auth → Redirect URLs**, so links and `callback` match production.
5. **Redeploy** after changing env. **Crons** in `vercel.json` use the **full** path including the app prefix, e.g. `/ogkit/api/cron/...`.

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
