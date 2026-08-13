import Link from 'next/link'
import { notFound } from 'next/navigation'
import { absoluteSiteUrl, getApiUrl, withBasePath } from '@/config/paths'
import { siteConfig } from '@/config/site'
import { isOpenAccess } from '@/config/access'
import { marketingMetadata } from '@/lib/marketing-metadata'
import { breadcrumbListJsonLd } from '@/lib/breadcrumbs'
import { FinishCta } from '@/components/marketing/finish-cta'

type Section = {
  heading: string
  paragraphs?: string[]
  bullets?: string[]
  code?: string
}

type Guide = {
  title: string
  description: string
  h1: string
  intro: string
  sections: Section[]
  faq: { question: string; answer: string }[]
  related: [string, string][]
}

const openAccess = isOpenAccess()
const base = siteConfig.url
const api = (path: string) => `${base}${getApiUrl(path)}`

const GUIDES: Record<string, Guide> = {
  quickstart: {
    title: 'OGKit quickstart — first Open Graph image in 60 seconds',
    description:
      'Ship your first 1200×630 og:image with OGKit: Playground → copy URL → paste into HTML or Next.js metadata → verify with Facebook Debugger. No signup required (demo=1).',
    h1: 'Your first OG image in 60 seconds',
    intro:
      'You do not need an account to evaluate OGKit. This path gets a real 1200×630 PNG into your page meta tags, then optionally swaps demo mode for an API key.',
    sections: [
      {
        heading: 'Step 1 — Pick a template in the Playground',
        paragraphs: [
          'Open the Playground, choose a template (article or minimal for most sites), and fill title + optional subtitle.',
          openAccess
            ? 'Leave demo=1 on — during open access there is no watermark and no quota.'
            : 'Leave demo=1 on for a watermarked evaluation image with no API key.',
        ],
        bullets: [
          'Playground: live PNG preview at 1200×630',
          'Copy the HTTPS image URL from the preview panel',
          'Prefer short titles (~60–80 chars) so Slack/LinkedIn do not clip the meaning',
        ],
      },
      {
        heading: 'Step 2 — Paste into HTML',
        paragraphs: ['Put the absolute URL in both Open Graph and Twitter tags:'],
        code: `<meta property="og:image" content="${api('/api/og/article')}?demo=1&title=Hello%20OGKit" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:image" content="${api('/api/og/article')}?demo=1&title=Hello%20OGKit" />`,
      },
      {
        heading: 'Step 3 — Next.js App Router (optional)',
        paragraphs: ['If you use Next.js metadata API:'],
        code: `import type { Metadata } from "next";

const og = new URL("${api('/api/og/article')}");
og.searchParams.set("demo", "1");
og.searchParams.set("title", "Hello OGKit");

export const metadata: Metadata = {
  openGraph: { images: [{ url: og.toString(), width: 1200, height: 630 }] },
  twitter: { card: "summary_large_image", images: [og.toString()] },
};`,
      },
      {
        heading: 'Step 4 — Verify with debuggers',
        bullets: [
          'Facebook Sharing Debugger — scrape and confirm the image',
          'LinkedIn Post Inspector — refresh if an old card is cached',
          'Twitter/X Card Validator — summary_large_image',
          'See Tools for links, and Caching & rescrape when platforms keep old images',
        ],
      },
      {
        heading: 'Step 5 — Production key (when ready)',
        paragraphs: [
          'Sign in, create an API key, replace demo=1 with key=… (or Authorization: Bearer). Keep keys server-side — never commit them to the client bundle.',
          'For public HTML, prefer signed URLs (see the Signed URLs guide).',
        ],
      },
    ],
    faq: [
      {
        question: 'Do I need to sign up first?',
        answer: openAccess
          ? 'No. demo=1 works without an account. Create a key when you want rotation, allowlists, or usage tracking.'
          : 'No for evaluation (demo=1). Production URLs need a free or paid API key.',
      },
      {
        question: 'Why is my social preview still the old image?',
        answer:
          'Most networks cache aggressively. Change the image URL (or query) and re-scrape with Facebook/LinkedIn tools. See Caching & rescrape.',
      },
    ],
    related: [
      ['Playground', '/playground'],
      ['API reference', '/docs'],
      ['Caching & rescrape', '/guides/caching-and-rescrape'],
      ['Next.js guide', '/for/nextjs'],
    ],
  },
  'signed-urls': {
    title: 'Signed URLs & domain allowlists — OGKit',
    description:
      'HMAC-SHA256 signed Open Graph image URLs, domain allowlists, dashboard toggles, Node/Python signing examples, and error codes for public og:image endpoints.',
    h1: 'Signed URLs and domain allowlists',
    intro:
      'When an OGKit image URL is public (embedded in HTML that anyone can view), a raw API key in the query string is a credential leak. Signed URLs and domain allowlists let you keep keys server-side while still serving deterministic 1200×630 PNGs to Slack, LinkedIn, Discord, and crawlers.',
    sections: [
      {
        heading: 'When you need signing',
        paragraphs: [
          'Use require-signed-urls on a key when the image URL will appear in public HTML, sitemaps, or RSS. Scrapers fetch the URL without cookies; they do not need your key — they need a URL that already includes a valid HMAC signature (or a key that does not require signing).',
          'Domain allowlists are complementary: if a key has allowed domains, pass domain=example.com (or your claim) and OGKit rejects requests whose domain claim is outside the list.',
        ],
        bullets: [
          'Public marketing pages and blog posts → prefer signed URLs',
          'Internal previews / CI → demo=1 or a key without signing is fine',
          'Multiple brands on one account → one key per domain allowlist',
        ],
      },
      {
        heading: 'How signing works',
        paragraphs: [
          'Enable “Require signed URLs” on the key in the dashboard. Then every GET to /api/og/{template} (and /api/og/auto) with that key must include sig=…',
          'Canonical string: pathname + ? + sorted query string with sig removed. Sign with HMAC-SHA256 using the full API key (ogk_live_…) as the secret. Digest is lowercase hex.',
          'Important: sort query parameters before hashing. Changing parameter order without re-sorting produces a different signature and returns invalid_signature.',
        ],
        code: `import { createHmac } from "node:crypto";

function signOgUrl(rawUrl: string, apiKey: string) {
  const url = new URL(rawUrl);
  const params = new URLSearchParams(url.searchParams);
  params.delete("sig");
  params.sort();
  const query = params.toString();
  const canonical = query ? \`\${url.pathname}?\${query}\` : url.pathname;
  const sig = createHmac("sha256", apiKey).update(canonical).digest("hex");
  params.set("sig", sig);
  url.search = params.toString();
  return url.toString();
}

const unsigned = new URL("${api('/api/og/article')}");
unsigned.searchParams.set("key", process.env.OGKIT_KEY!);
unsigned.searchParams.set("title", "Ship notes");
unsigned.searchParams.set("domain", "example.com");
const imageUrl = signOgUrl(unsigned.toString(), process.env.OGKIT_KEY!);
// → put imageUrl in metadata.openGraph.images`,
      },
      {
        heading: 'Python example',
        code: `import hashlib, hmac
from urllib.parse import urlencode, urlparse, parse_qsl, urlunparse

def sign_og_url(raw_url: str, api_key: str) -> str:
    parts = urlparse(raw_url)
    params = [(k, v) for k, v in parse_qsl(parts.query, keep_blank_values=True) if k != "sig"]
    params.sort(key=lambda kv: kv[0])
    query = urlencode(params)
    canonical = f"{parts.path}?{query}" if query else parts.path
    sig = hmac.new(api_key.encode(), canonical.encode(), hashlib.sha256).hexdigest()
    params.append(("sig", sig))
    return urlunparse(parts._replace(query=urlencode(params)))`,
      },
      {
        heading: 'Errors',
        bullets: [
          'missing_signature — key requires signing but sig is absent',
          'invalid_signature — HMAC mismatch (wrong key, unsorted params, or mutated query)',
          'domain_not_allowed — domain claim not in the key allowlist',
        ],
      },
      {
        heading: 'Operational tips',
        paragraphs: [
          'Sign on the server at request time (or at build time for static pages). Never ship the raw API key to the browser just to compute sig.',
          'If you change title/subtitle after deploy, regenerate the signature — the signed URL is bound to the exact query string.',
          openAccess
            ? 'During open access, signing is optional for evaluation, but still recommended once URLs are public.'
            : 'Signed URLs are available on paid plans; enable the toggle per key in the dashboard.',
        ],
      },
    ],
    faq: [
      {
        question: 'Do social networks need my API key?',
        answer:
          'No. Scrapers only fetch the final HTTPS image URL. Signing lets that URL be public without embedding a usable bare key.',
      },
      {
        question: 'Can I sign demo=1 URLs?',
        answer:
          'demo=1 skips API key auth, so signatures are not required. Use signing with a real key for production metadata.',
      },
      {
        question: 'What is the domain parameter for?',
        answer:
          'Optional claim checked against the key’s allowlist. Use it when one account serves multiple properties and each key is scoped to a hostname.',
      },
    ],
    related: [
      ['API reference', '/docs'],
      ['Dashboard keys', '/dashboard/keys'],
      ['Caching & rescrape', '/guides/caching-and-rescrape'],
      ['Next.js guide', '/for/nextjs'],
    ],
  },
  'auto-og': {
    title: 'Auto Open Graph images from a URL — OGKit /api/og/auto',
    description:
      'Use GET /api/og/auto to fetch page metadata (title, description, image, favicon, theme-color), pick a template, override fields, and handle errors for dynamic og:image.',
    h1: 'Auto OG images from a page URL',
    intro:
      '/api/og/auto fetches a public page, extracts Open Graph / Twitter / HTML metadata, and renders a 1200×630 card. Use it when you want one endpoint that adapts to existing pages — CMS posts, docs, or launch URLs — without manually mapping every field.',
    sections: [
      {
        heading: 'Endpoint',
        paragraphs: [
          'GET /api/og/auto?url=https://example.com&key=KEY (or demo=1 without a key). Optional template=article|minimal|… forces a template; otherwise OGKit picks article when an image is found, else minimal.',
        ],
        code: `${api('/api/og/auto')}?demo=1&url=${encodeURIComponent('https://example.com')}

${api('/api/og/auto')}?key=KEY&url=${encodeURIComponent('https://example.com/blog/post')}&template=article&title=Override+title`,
      },
      {
        heading: 'What metadata is extracted',
        bullets: [
          'title — og:title → twitter:title → <title>',
          'description — og:description → twitter:description → meta description (used as subtitle)',
          'image — og:image → twitter:image (absolute URL)',
          'favicon — link rel icon / apple-touch-icon (mapped to logo when applicable)',
          'theme-color — used as accent when it is a #RRGGBB value',
        ],
      },
      {
        heading: 'Overrides',
        paragraphs: [
          'Any normal OG query param overrides extracted values: title, subtitle, image, logo, accent, theme, pattern, and template-specific fields. Use overrides when the remote page title is noisy or you want a launch-specific card.',
        ],
      },
      {
        heading: 'Safety and limits',
        bullets: [
          'Only http/https URLs; localhost and private IPs are rejected (invalid_url)',
          'Fetch timeout ~5 seconds; large HTML is truncated before parse',
          'If title cannot be found → metadata_not_found (422)',
          'Same auth, quota, and signing rules as /api/og/{template}',
        ],
      },
      {
        heading: 'When to use auto vs explicit templates',
        paragraphs: [
          'Prefer explicit /api/og/{template} when you already have structured fields in your CMS or database — titles stay clean and cards stay on-brand.',
          'Prefer /api/og/auto for aggregators, link-unfurl tools, changelog mirrors, or “share this external URL” flows where you do not control the source HTML.',
        ],
      },
      {
        heading: 'Next.js pattern',
        code: `export async function generateMetadata({ params }) {
  const image = new URL("${api('/api/og/auto')}");
  image.searchParams.set("key", process.env.OGKIT_KEY!);
  image.searchParams.set("url", \`https://example.com/posts/\${params.slug}\`);
  image.searchParams.set("template", "article");
  return {
    openGraph: { images: [{ url: image.toString(), width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", images: [image.toString()] },
  };
}`,
      },
    ],
    faq: [
      {
        question: 'Does auto re-fetch on every social share?',
        answer:
          'Scrapers hit your page’s og:image URL. That OGKit URL may re-fetch the source page on cache miss. Prefer deterministic Cache-Control-friendly URLs and stable source pages; see the caching guide.',
      },
      {
        question: 'Can I use auto with signed URLs?',
        answer: 'Yes. Sign the full auto URL (including url= and overrides) the same way as other templates.',
      },
      {
        question: 'Why did I get metadata_not_found?',
        answer:
          'The remote HTML had no usable title (no og:title, twitter:title, or <title>), the fetch failed, or the host was blocked as private.',
      },
    ],
    related: [
      ['API reference', '/docs'],
      ['Signed URLs', '/guides/signed-urls'],
      ['Appearance params', '/guides/appearance'],
      ['Playground', '/playground'],
    ],
  },
  'caching-and-rescrape': {
    title: 'Open Graph image caching & rescrape — OGKit',
    description:
      'How OGKit Cache-Control works, CDN caching of deterministic PNG URLs, and how to force Facebook, LinkedIn, Slack, and X to rescrape updated og:image cards.',
    h1: 'Caching and rescrape',
    intro:
      'Social networks and CDNs treat og:image as a separate HTTP resource. Deterministic OGKit URLs cache well — which is great for performance and bad when you forget how to bust a stale preview. This guide covers both sides.',
    sections: [
      {
        heading: 'What OGKit sends',
        paragraphs: [
          'Template routes return Cache-Control: public, max-age=0, s-maxage=31536000, stale-while-revalidate=86400 — browsers revalidate; shared CDNs may keep the PNG for up to a year while allowing stale serves during revalidation.',
          'Auto routes use a shorter shared max-age (about one day) because the upstream page can change.',
        ],
        bullets: [
          'Identical query string → identical bytes → CDN hit',
          'Change title/subtitle/accent → new URL → new cache object',
          'demo=1 and production key URLs are different cache keys',
        ],
      },
      {
        heading: 'Design URLs for cache friendliness',
        paragraphs: [
          'Avoid random query params (_t=, timestamps) in production metadata. Use them only in Playground or local debugging.',
          'When content changes materially, either update fields in the OGKit URL (preferred) or append a version param you control (v=2026-08-09) and update HTML metadata so scrapers request the new object.',
        ],
      },
      {
        heading: 'Platform rescrape checklist',
        bullets: [
          'Facebook / Instagram — Sharing Debugger: scrape again',
          'LinkedIn — Post Inspector',
          'X / Twitter — Card Validator (availability varies); version the image URL if stuck',
          'Slack — often caches aggressively; version the image URL or wait; opengraph.xyz helps inspect tags',
          'Discord / iMessage — usually follow og:image; versioning helps after redesigns',
        ],
      },
      {
        heading: 'Debug workflow',
        paragraphs: [
          '1) Open your page HTML and confirm absolute og:image and twitter:image match.',
          '2) curl -I the image URL — check content-type image/png and cache headers.',
          '3) Preview in Playground or opengraph.xyz.',
          '4) Force rescrape in Facebook/LinkedIn after deploy.',
        ],
        code: `curl -sI "${api('/api/og/minimal')}?demo=1&title=Hello" | grep -iE 'HTTP|content-type|cache-control'`,
      },
      {
        heading: 'Common mistakes',
        bullets: [
          'Relative og:image paths — scrapers resolve against the wrong host',
          'Updating page copy but leaving the same OGKit title in metadata',
          'Putting API keys only in client JS — crawlers never see the updated URL',
          'Expecting Slack to drop cache without a new image URL',
        ],
      },
    ],
    faq: [
      {
        question: 'Why is Slack still showing the old card?',
        answer:
          'Unfurl caches are sticky. Change the image URL (new fields or v=) and reshare, or wait for eviction. Confirm HTML already points at the new URL.',
      },
      {
        question: 'Should I set max-age on my HTML page too?',
        answer:
          'HTML caching is separate. Keep page HTML fresh enough that crawlers see new og:image values; the PNG can be cached longer once the URL is correct.',
      },
      {
        question: 'Does signed URL signing break CDN cache?',
        answer:
          'No — sig is part of the URL. As long as the signature is stable for the same fields, CDNs cache that exact URL.',
      },
    ],
    related: [
      ['Tools & debuggers', '/tools'],
      ['Open Graph SEO guide', '/blog/open-graph-images-seo-guide'],
      ['Signed URLs', '/guides/signed-urls'],
      ['Auto OG', '/guides/auto-og'],
    ],
  },
  appearance: {
    title: 'OGKit appearance — theme, accent, pattern, fonts',
    description:
      'Customize OGKit cards with theme (light/dark/classic), accent and bg hex colors, dots/grid patterns, and font family names on supported templates (minimal, gradient).',
    h1: 'Theme, accent, pattern, and fonts',
    intro:
      'Some OGKit templates accept appearance query parameters so cards match your brand without a custom renderer. Supported most richly on minimal and gradient; other templates use fixed layouts with their own fields (logo, image, code, etc.).',
    sections: [
      {
        heading: 'Parameters',
        bullets: [
          'theme — light | dark | classic (minimal)',
          'accent — #RRGGBB highlight (minimal, gradient; auto may pass theme-color)',
          'bg — #RRGGBB background override',
          'pattern — none | dots | grid',
          'font — CSS font-family name string for supported templates (e.g. Georgia, ui-sans-serif)',
        ],
      },
      {
        heading: 'Which templates honor appearance?',
        paragraphs: [
          'minimal — theme, accent, bg, pattern, font',
          'gradient — accent, bg, pattern, font',
          'article / product / brand / quote / podcast / event / job / dark-code — structure-first layouts; customize via their content fields (image, logo, code, price…) rather than theme packs.',
        ],
      },
      {
        heading: 'Examples',
        code: `${api('/api/og/minimal')}?demo=1&title=Launch&subtitle=Brand+card&theme=dark&accent=%233dffa8&pattern=grid

${api('/api/og/gradient')}?demo=1&title=Changelog+v2&subtitle=Signed+URLs&accent=%230ea5e9&pattern=dots&font=Georgia`,
      },
      {
        heading: 'Font guidance',
        paragraphs: [
          'Pass a font family name that the renderer can resolve. System and common web-safe families are the safest default for universal renders.',
          'Pricing mentions Google Fonts on higher tiers as a product direction for branded typography; always preview in the Playground before committing a production URL — if a face does not load, the template falls back to a sans stack.',
        ],
      },
      {
        heading: 'Brand consistency tips',
        bullets: [
          'Pick one accent hex for the product and reuse it across minimal/gradient cards',
          'Keep titles under ~60–80 characters so they survive Slack crop',
          'Pair dark theme with light accent for docs; light theme with brand accent for marketing',
          'Avoid putting critical meaning only in pattern color — patterns are decorative',
        ],
      },
    ],
    faq: [
      {
        question: 'Can I upload a custom font file?',
        answer:
          'Not via the public query API today. Use the font family name parameter on supported templates, or keep custom typography inside a self-hosted @vercel/og route if you need exact font files.',
      },
      {
        question: 'Why was my accent ignored?',
        answer:
          'Accent must be #RRGGBB (six hex digits). Named colors and rgb() are rejected by validation. Also confirm you are on minimal or gradient.',
      },
      {
        question: 'Does appearance work with /api/og/auto?',
        answer:
          'Yes — pass theme/accent/pattern/font as overrides. Auto may also set accent from the page theme-color when it is a valid hex.',
      },
    ],
    related: [
      ['Playground', '/playground'],
      ['API reference', '/docs'],
      ['Auto OG', '/guides/auto-og'],
      ['Product launch use case', '/use-case/product-launch'],
    ],
  },
  mcp: {
    title: 'OGKit MCP for Cursor & AI agents',
    description:
      'Connect the OGKit Model Context Protocol server in Cursor: remote /api/mcp URL, tools (og_build_url, og_preview, og_nextjs_snippet, …), plugin bundle, and production key workflow.',
    h1: 'OGKit MCP for Cursor and AI agents',
    intro:
      'OGKit exposes a remote MCP server so coding agents can list templates, build image URLs, preview cards, emit Next.js generateMetadata snippets, and validate a page’s Open Graph tags — without inventing hosts or hand-rolling query strings.',
    sections: [
      {
        heading: 'What is MCP?',
        paragraphs: [
          'MCP (Model Context Protocol) is a standard way for AI coding tools — Cursor, Claude Desktop, and similar agents — to call external tools over HTTP. Instead of pasting docs into chat, the agent can invoke real operations (list templates, build a URL, validate a page).',
          'Why care: ask Cursor “generate og:image metadata for every blog post in this folder” and it can use OGKit tools instead of inventing fake image hosts or hand-writing query strings.',
        ],
        bullets: [
          'You: “Add Open Graph images for these posts”',
          'Agent: og_list_templates → og_build_url → og_nextjs_snippet',
          'You: paste or accept the PR — then verify with og_validate_page',
        ],
      },
      {
        heading: 'Endpoint',
        paragraphs: [
          'Streamable HTTP MCP at /api/mcp (GET/POST/DELETE). Stateless; tools do not require an API key. Production keys are only needed when you ask the agent to build non-demo URLs.',
        ],
        code: `{
  "mcpServers": {
    "ogkit": {
      "url": "${api('/api/mcp')}"
    }
  }
}`,
      },
      {
        heading: 'Install options',
        bullets: [
          'Cursor: project or global .cursor/mcp.json with the URL above',
          `Plugin bundle in the repo: ${siteConfig.github}/tree/main/ogkit/cursor-plugin (mcp.json + skill + rules)`,
          'Onboarding wizard after sign-in can copy an mcp.json snippet',
          'Marketplace: submit the plugin path at cursor.com/marketplace/publish',
        ],
      },
      {
        heading: 'Tools',
        bullets: [
          'og_list_templates — ids + descriptions',
          'og_build_url — canonical HTTPS image URL (demo=1 by default)',
          'og_preview — helpful preview payload for agents',
          'og_nextjs_snippet — generateMetadata-ready TypeScript',
          'og_validate_page — fetch a URL and report OG/Twitter tags',
          'ogkit_get_started — short onboarding for agents',
        ],
      },
      {
        heading: 'Recommended agent workflow',
        paragraphs: [
          '1) og_list_templates → pick article/minimal/product/…',
          '2) og_build_url with title (+ subtitle) in demo mode',
          '3) og_nextjs_snippet for App Router metadata',
          '4) User signs in for a key → rebuild URL with apiKey for production',
          '5) og_validate_page on the deployed canonical URL',
        ],
      },
      {
        heading: 'Safety rules for agents',
        bullets: [
          'Never invent hosts — always use the canonical OGKit origin',
          'Keep API keys out of client components and git commits',
          openAccess
            ? 'Open access: demo=1 is production-quality (no watermark); still prefer keys for rotation'
            : 'demo=1 is watermarked; production needs a key',
          'Prefer absoluteSiteUrl paths from /llms.txt when linking docs',
        ],
      },
      {
        heading: 'Human docs companions',
        paragraphs: [
          'Agents should also read /llms.txt and /docs. For SEO and rescrape context, point them at the Open Graph SEO guide and the caching guide.',
        ],
      },
    ],
    faq: [
      {
        question: 'Does OGKit MCP require auth?',
        answer:
          'Tool calls on /api/mcp do not require auth. Generating non-demo image URLs requires the user to supply an API key to og_build_url.',
      },
      {
        question: 'Is this the same as Placid MCP?',
        answer:
          'No. Placid MCP targets creative template automation. OGKit MCP is focused on og:image URL construction, Next.js snippets, and page validation.',
      },
      {
        question: 'Can I self-host the MCP server?',
        answer:
          'The MCP route ships with the OGKit Next.js app. Point Cursor at your deployment’s /api/mcp if you self-host the whole product.',
      },
    ],
    related: [
      ['API reference', '/docs'],
      ['llms.txt', '/llms.txt'],
      ['Next.js guide', '/for/nextjs'],
      ['Signed URLs', '/guides/signed-urls'],
    ],
  },
  'og-image-rendering': {
    title: 'Satori vs Puppeteer for 1200×630 Open Graph images',
    description:
      'Compare Satori, Puppeteer, and OGKit for generating Open Graph images, social preview cards, and dynamic 1200×630 PNG assets — without owning a custom renderer.',
    h1: 'Satori vs Puppeteer for Open Graph images',
    intro:
      'Satori and Puppeteer both produce images, but they solve different problems. OGKit uses hosted templates so teams can ship Open Graph cards without owning either rendering pipeline.',
    sections: [
      {
        heading: 'Quick comparison',
        bullets: [
          'Satori: JSX-like layouts → PNG (what @vercel/og uses under the hood)',
          'Puppeteer: full browser screenshots of HTML/CSS pages',
          'OGKit: hosted 1200×630 templates via HTTPS URL — you pass fields, not a renderer',
        ],
      },
      {
        heading: 'When Satori wins',
        paragraphs: [
          'Use Satori (or @vercel/og) when you want React-to-image control inside your own app and you are comfortable owning fonts, layout limits, Edge/Node budgets, and redeploys for every template change.',
        ],
      },
      {
        heading: 'When Puppeteer wins',
        paragraphs: [
          'Use Puppeteer when you need a real browser capture — full page fidelity, complex CSS, or screenshots for QA/thumbnails. That path is usually slower and more fragile for og:image unfurls.',
        ],
      },
      {
        heading: 'When OGKit wins',
        paragraphs: [
          'Use OGKit when the job is production social cards from structured fields (title, subtitle, logo, product). You get API keys, signed URLs, Playground, MCP, and a stable metadata URL without running Satori or Chromium yourself.',
        ],
        code: `// One URL for metadata instead of a custom renderer
${base}/api/og/article?demo=1&title=Satori+vs+Puppeteer&author=OGKit`,
      },
    ],
    faq: [
      {
        question: 'Is OGKit built on Satori or Puppeteer?',
        answer:
          'OGKit exposes a fixed template API. You do not configure Satori or Puppeteer — you pick a template slug and query params. For a product comparison with @vercel/og (Satori-based), see /compare/ogkit-vs-vercel-og.',
      },
      {
        question: 'Should og:image be a screenshot?',
        answer:
          'Usually no. Screenshots include nav, cookies, and responsive quirks. Prefer designed 1200×630 cards — see /compare/ogkit-vs-screenshot-apis.',
      },
    ],
    related: [
      ['OGKit vs @vercel/og', '/compare/ogkit-vs-vercel-og'],
      ['OGKit vs screenshot APIs', '/compare/ogkit-vs-screenshot-apis'],
      ['OGKit vs other OG APIs', '/compare/ogkit-vs-og-image-apis'],
      ['API reference', '/docs'],
    ],
  },

}

type Props = { params: { slug: string } }

export function generateStaticParams() {
  return Object.keys(GUIDES).map((slug) => ({ slug }))
}

export function generateMetadata({ params }: Props) {
  const guide = GUIDES[params.slug]
  if (!guide) return {}
  return marketingMetadata({
    title: guide.title,
    description: guide.description,
    pathname: `/guides/${params.slug}`,
  })
}

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-lg border bg-muted/40 p-4 text-xs leading-relaxed">
      <code className="font-mono">{children}</code>
    </pre>
  )
}

export default function GuidePage({ params }: Props) {
  const guide = GUIDES[params.slug]
  if (!guide) notFound()

  const canonical = absoluteSiteUrl(`/guides/${params.slug}`)
  const breadcrumbLd = breadcrumbListJsonLd([
    { name: 'Guides', path: '/guides' },
    { name: guide.h1, path: `/guides/${params.slug}` },
  ])
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: guide.faq.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  }
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: guide.h1,
    description: guide.description,
    url: canonical,
    author: { '@type': 'Organization', name: siteConfig.name, url: absoluteSiteUrl('') },
    publisher: { '@type': 'Organization', name: siteConfig.name, url: absoluteSiteUrl('') },
    mainEntityOfPage: canonical,
  }

  return (
    <div className="container max-w-3xl space-y-12 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />

      <header>
        <p className="text-sm font-medium text-muted-foreground">
          <Link href={withBasePath('/guides')} className="hover:text-foreground">
            Guides
          </Link>
        </p>
        <h1 className="mt-1 font-heading text-4xl font-bold tracking-tight">{guide.h1}</h1>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{guide.intro}</p>
      </header>

      {guide.sections.map((section) => (
        <section key={section.heading} className="space-y-3">
          <h2 className="font-heading text-2xl font-semibold tracking-tight">{section.heading}</h2>
          {section.paragraphs?.map((p) => (
            <p key={p.slice(0, 48)} className="text-sm leading-relaxed text-muted-foreground">
              {p}
            </p>
          ))}
          {section.bullets && (
            <ul className="list-inside list-disc space-y-2 text-sm text-muted-foreground">
              {section.bullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          )}
          {section.code && <CodeBlock>{section.code}</CodeBlock>}
        </section>
      ))}

      <section>
        <h2 className="font-heading text-2xl font-semibold tracking-tight">FAQ</h2>
        <div className="mt-4 space-y-5">
          {guide.faq.map((item) => (
            <div key={item.question}>
              <h3 className="font-semibold">{item.question}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.answer}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-heading text-2xl font-semibold tracking-tight">Related</h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {guide.related.map(([label, href]) => (
            <li key={href}>
              <Link href={withBasePath(href)} className="text-sm font-medium text-primary underline-offset-4 hover:underline">
                {label} →
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <FinishCta />
    </div>
  )
}
