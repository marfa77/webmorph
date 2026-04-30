# SEO & GEO page perfection checklist (OGKit)

Use this for **every public marketing / SEO page**: home, `/docs`, `/pricing`, `/tools`, `/compare/*`, `/for/*`, `/platform/*`, `/use-case/*`, `/contact`, `/privacy`, `/terms`, `/llms.txt`, `/llm.txt`.

**Version:** 11 sections · **69 items** (E-E-A-T, Core Web Vitals 2024+, GEO/llms.txt, IndexNow, GA4 AI traffic).

---

## 1. Crawlability & indexation (7)

- [ ] **1.1** Page returns **200** for the canonical URL (no soft 404, no unintended redirect chains).
- [ ] **1.2** **`robots.txt`** allows crawling of this URL path; no accidental `Disallow` overlap.
- [ ] **1.3** URL is listed in **`sitemap.xml`** with correct absolute URL (include `publicBasePath` if mounted under a path).
- [ ] **1.4** Single **canonical** (`alternates.canonical` or `<link rel="canonical">`) — matches indexed host (e.g. `www`).
- [ ] **1.5** No **duplicate** content: same copy not served on multiple URLs without canonical to one primary.
- [ ] **1.6** Important content is **server-rendered** or in initial HTML (not hidden behind client-only gates for crawlers).
- [ ] **1.7** **404** only for truly removed pages; removed URLs handled (410/redirect) per policy.

---

## 2. Metadata & SERP snippet (8)

- [ ] **2.1** **`<title>`** unique, primary keyword near start, ~50–60 characters displayed (avoid truncation noise).
- [ ] **2.2** **`meta description`** unique, actionable, ~140–160 characters for typical display (can be longer if justified).
- [ ] **2.3** **`metadataBase`** / absolute URLs for OG images — no broken relative OG URLs in production.
- [ ] **2.4** **Open Graph**: `og:title`, `og:description`, `og:url`, `og:image` (1200×630 preferred), `og:type` where relevant.
- [ ] **2.5** **Twitter/X**: `twitter:card` (`summary_large_image` for OG pages), `twitter:title`, `twitter:description`, `twitter:image`.
- [ ] **2.6** Snippet matches **intent** of the page (no clickbait mismatch → high bounce hurts quality signals).
- [ ] **2.7** Brand consistent: product name spelling, tagline alignment with `siteConfig`.
- [ ] **2.8** **`lang`** on `<html>` correct (`en` for OGKit); no mixed-language noise unless intentional.

---

## 3. On-page content & semantics (8)

- [ ] **3.1** One clear **H1**; logical **H2–H3** hierarchy; no skipped levels for styling only.
- [ ] **3.2** **First screen** answers: what is this page, who is it for, what to do next.
- [ ] **3.3** **Entities** clear (product name, category: Open Graph API, comparisons named explicitly).
- [ ] **3.4** **FAQ** (on-page) aligns with real questions; answers are factual, not fluff.
- [ ] **3.5** **Facts** (prices, limits, plan names) match **`PLANS`**, `/pricing`, and **`llms.txt`** — no contradictions.
- [ ] **3.6** **Code samples** use **`siteConfig.url`** (or app base helper), not stale hardcoded domains.
- [ ] **3.7** **Internal links** to docs, playground, pricing, relevant compare/use-case pages where helpful.
- [ ] **3.8** **CTA** visible (Sign in, Playground, Docs) without blocking content.

---

## 4. E-E-A-T (Experience, Expertise, Authoritativeness, Trust) (9)

- [ ] **4.1** **Publisher / site** identity clear: who operates the service (`siteConfig.name`, domain).
- [ ] **4.2** **Organization** represented in JSON-LD (`publisher`, `SoftwareApplication`, `WebSite`) where appropriate.
- [ ] **4.3** **Contact** path exists and is linked (`/contact`) — real channel, expectations set (no false “24/7 support” if not true).
- [ ] **4.4** **Legal**: **Privacy** and **Terms** linked from footer; last updated dates maintained when policy changes.
- [ ] **4.5** **Author / byline** for long-form guides: TechArticle or article schema with `author` Organization or Person when applicable.
- [ ] **4.6** **Credentials / expertise** signals: accurate technical claims (e.g. `@vercel/og`, Satori, API limits) — cite behavior, not hype.
- [ ] **4.7** **Trust**: pricing, refund/billing policy honest and consistent with Cryptomus copy on `/pricing`.
- [ ] **4.8** **Security / product** claims: signed URLs, demo mode described accurately in docs and marketing.
- [ ] **4.9** **Third-party** logos/names (competitors) used in **comparison** context only — factual, non-defamatory framing.

---

## 5. Core Web Vitals (8) — LCP · INP · CLS

Targets: **LCP &lt; 2.5 s**, **INP &lt; 200 ms**, **CLS &lt; 0.1** (field data where possible; lab as regression guard).

- [ ] **5.1** **LCP**: largest paint is meaningful (hero text/image); no huge blocking images above the fold without dimensions.
- [ ] **5.2** **LCP**: fonts don’t block excessively (subset, `display: swap` or system stack where appropriate).
- [ ] **5.3** **INP**: interactions (nav, cookie banner, forms) respond quickly — avoid long main-thread tasks on marketing pages.
- [ ] **5.4** **INP**: avoid heavy third-party scripts on marketing layout; defer non-critical JS.
- [ ] **5.5** **CLS**: images and embeds have **width/height** or reserved space (OG meta images in metadata count for previews, not CLS — still check layout).
- [ ] **5.6** **CLS**: no layout jump on font load / cookie banner — reserve space or stable min-height.
- [ ] **5.7** **CLS**: sticky header doesn’t shift content unexpectedly on load.
- [ ] **5.8** **Mobile**: same page usable on narrow viewports (overflow-x, tap targets, readable font sizes).

---

## 6. GEO — Generative Engine Optimization & LLM visibility (8)

- [ ] **6.1** **`/llms.txt`** present, **plain text**, UTF-8, cache headers reasonable; facts match live product.
- [ ] **6.2** **`/llm.txt`** alias serves same corpus (or redirects) for tools that expect that path.
- [ ] **6.3** **`llms.txt`** links to **canonical** URLs for compares, use cases, `/docs`, `/pricing`, API patterns.
- [ ] **6.4** **`robots.txt`** explicitly allows major **AI crawlers** used for training/answers (keep list updated with `robots.ts`).
- [ ] **6.5** **Structured, copy-pasteable** facts (endpoints, template list, demo=1, billing model) for RAG-style retrieval.
- [ ] **6.6** **Code / URL examples** in body are valid and minimal — LLMs cite pages with runnable patterns.
- [ ] **6.7** **`/docs`** mentions **llms.txt** and agent discovery (human + machine path to same truth).
- [ ] **6.8** No **contradiction** between marketing prose, `llms.txt`, and API implementation.

---

## 7. IndexNow (4)

- [ ] **7.1** **Key file** is reachable over HTTPS and returns **only** the API key as `text/plain`. OGKit: **`GET /api/indexnow/key`** when `INDEXNOW_API_KEY` is set (`keyLocation` = that full URL).
- [ ] **7.2** **`INDEXNOW_API_KEY`** is set in deployment env (never committed); key registered in Bing Webmaster / IndexNow.
- [ ] **7.3** **Publish** workflow: `POST /api/indexnow/publish` with header `Authorization: Bearer CRON_SECRET` and body `{ "urls": string[] }` (max 10k URLs per request per IndexNow). Automate from CI or a scheduled job after deploy.
- [ ] **7.4** New or significantly updated **SEO URLs** are pinged within 24h of go-live.

---

## 8. Structured data (JSON-LD) (7)

- [ ] **8.1** JSON-LD **valid** (parseable JSON, no trailing commas, correct `@context`).
- [ ] **8.2** **`FAQPage`** matches visible FAQ copy (same questions/answers or subset policy documented).
- [ ] **8.3** **`BreadcrumbList`** where hierarchy exists (use case, framework, platform guides).
- [ ] **8.4** **`WebSite` / `SoftwareApplication`** on home — offers/prices match real tiers.
- [ ] **8.5** **Compare** pages: extra `@graph` only when intentional; no duplicate conflicting `WebPage` URLs.
- [ ] **8.6** No **spammy** schema (hidden FAQ, fake ratings).
- [ ] **8.7** **Rich result** eligibility sanity check (Google Rich Results Test) for templates that use FAQ.

---

## 9. Internal linking & information architecture (6)

- [ ] **9.1** Page is reachable within **≤3 clicks** from home (nav, footer, or hub section).
- [ ] **9.2** **Related pages** block or inline links to next logical step (docs, playground, compare).
- [ ] **9.3** **Anchor text** descriptive (not only “click here”).
- [ ] **9.4** No **orphan** high-value SEO URLs (in sitemap but zero internal links).
- [ ] **9.5** **Hub** pages (`/docs`, `/tools`, dynamic social guide) link outward to specializations.
- [ ] **9.6** **Breadcrumbs** on UI optional; in JSON-LD recommended for guides.

---

## 10. Analytics & AI traffic measurement (5)

- [ ] **10.1** **GA4** property receives production traffic; internal/dev filtered if possible.
- [ ] **10.2** **UTM** or referrer taxonomy documented for campaigns (optional but consistent when used).
- [ ] **10.3** **Conversions** defined (sign-up, first API call, checkout start) — at least one primary funnel event.
- [ ] **10.4** **LLM / AI referrers**: explore GA4 dimension / exploration for referrers containing `chat.openai.com`, `claude.ai`, `perplexity`, etc. (as available); document limitations.
- [ ] **10.5** **Regular review** (e.g. monthly): top landing SEO pages, bounce, scroll, CTA clicks.

---

## 11. Compliance, privacy & honest commercial claims (5)

- [ ] **11.1** **Cookie** banner behavior matches Privacy (what is stored, why).
- [ ] **11.2** **Personal data** flows (auth, contact form) described in Privacy.
- [ ] **11.3** **Terms** cover service scope, billing, acceptable use — aligned with product behavior.
- [ ] **11.4** **Competitor** pages: factual pricing/features with **date or “as stated by vendor”** where dynamic.
- [ ] **11.5** **No medical/financial YMYL** overclaim; OGKit is dev tooling — still avoid misleading security or pricing claims.

---

## Quick pass: OGKit file map

| Area | Typical files |
|------|----------------|
| Metadata helper | `src/lib/marketing-metadata.ts` |
| Sitemap / robots | `src/app/sitemap.ts`, `src/app/robots.ts` |
| LLM corpus | `src/lib/llms-txt-body.ts`, `src/app/llms.txt/route.ts`, `src/app/llm.txt/route.ts` |
| IndexNow | `src/lib/indexnow.ts`, `src/app/api/indexnow/key/route.ts`, `src/app/api/indexnow/publish/route.ts` |
| GA4 (optional) | `src/components/analytics/ga4.tsx`, env `NEXT_PUBLIC_GA4_MEASUREMENT_ID` |
| Compare | `src/app/(marketing)/compare/[slug]/page.tsx` |
| Guides | `src/app/(marketing)/for/`, `platform/`, `use-case/` |
| Shell layout | `src/app/(marketing)/layout.tsx`, `src/app/layout.tsx` |
| Legal | `src/app/(marketing)/privacy/`, `terms/`, `contact/` |

---

## Changelog of this checklist

- **v2**: Added **E-E-A-T**, **Core Web Vitals (INP replaces FID)**, **GEO/llms.txt scale**, **IndexNow**, **GA4 / AI referrer** notes; expanded to **69** items in **11** sections.

When you complete a full-site audit, note **date** and **tool versions** (Lighthouse, Rich Results, GSC) at the bottom of your PR or runbook.
