import Link from 'next/link'
import { absoluteSiteUrl, withBasePath } from '@/config/paths'
import { siteConfig } from '@/config/site'
import { marketingMetadata } from '@/lib/marketing-metadata'
import { breadcrumbListJsonLd } from '@/lib/breadcrumbs'
import { FinishCta } from '@/components/marketing/finish-cta'

function guideOgImageUrl() {
  const u = new URL(absoluteSiteUrl('/api/og/minimal'))
  u.searchParams.set('demo', '1')
  u.searchParams.set('title', 'Open Graph image SEO')
  u.searchParams.set('subtitle', '1200×630 · Next.js · Google & LLMs')
  u.searchParams.set('accent', '#2563eb')
  return u.toString()
}

const GUIDE_KEYWORDS = [
  'open graph image size',
  'og:image',
  'og image seo',
  'dynamic open graph image',
  'next.js open graph image',
  'generateMetadata og:image',
  'twitter card image',
  'twitter:image',
  'link preview image',
  'slack unfurl image',
  'linkedin post inspector',
  'facebook sharing debugger',
  'google discover image',
  'schema.org Article',
  'llms.txt',
  'social preview metadata',
]

/** FAQ entries shared by JSON-LD and visible HTML (parity for Google + LLMs). */
const GUIDE_FAQ = [
  {
    name: 'What is the recommended Open Graph image size?',
    text: 'Use 1200×630 pixels (about 1.91:1) for Open Graph and most Twitter/X large image cards. Google may also use og:image and structured data for thumbnails in Search and Discover; very small images (under ~200×200) are often rejected.',
  },
  {
    name: 'Does Google use Open Graph images?',
    text: 'Google can use og:image together with schema.org markup (for example primaryImageOfPage or image on the main entity) when choosing thumbnails in Search and Discover. Strong alignment between title, description, og:image, and visible page content improves click-through.',
  },
  {
    name: 'Should og:image be an absolute URL?',
    text: 'Yes. Use an absolute HTTPS URL (include your public path prefix if the app is mounted below the domain root) so Slack, LinkedIn, Discord, iMessage, and crawlers fetch exactly the bytes your HTML references.',
  },
  {
    name: 'How do I set og:image in Next.js App Router?',
    text: 'Build the final image URL in generateMetadata or another server-only path, then assign it to metadata.openGraph.images and metadata.twitter.images. Never put API secrets in client components—only the generated HTTPS URL belongs in the head.',
  },
  {
    name: 'Why is my link preview wrong or cached on Facebook or LinkedIn?',
    text: 'Most platforms cache the first successful og:image they see for a URL. After you change art or copy, use the Facebook Sharing Debugger and LinkedIn Post Inspector to force a rescrape, or version the image URL (query string or new path) so caches see a new resource.',
  },
  {
    name: 'Can I use SVG or WebP for og:image?',
    text: 'Many scrapers expect PNG or JPEG for social previews; SVG is a poor default because not every consumer rasterizes it reliably. WebP/AVIF can work in some stacks but PNG at 1200×630 is the safest default for universal unfurling.',
  },
  {
    name: 'Do Open Graph tags affect rankings directly?',
    text: 'They are not a classic ranking factor like backlinks, but they strongly affect click-through from search and social, and they feed AI browsing tools that read HTML metadata. Weak or missing og:image hurts perceived quality next to competitors.',
  },
  {
    name: 'What should I ship for LLM crawlers (ChatGPT, Perplexity, etc.)?',
    text: 'Ship a canonical og:image, concise Article or TechArticle JSON-LD, and a machine-readable /llms.txt that points to your docs and guides. Consistent URLs across sitemap, canonical, and examples reduce hallucinated hosts in coding agents.',
  },
  {
    name: 'How large can an Open Graph image be before timeouts?',
    text: 'Stay well under ~1 MB for the PNG when possible; multi‑MB files increase rescrape failures on slow hosts. Prefer tuned PNG compression and capped typography instead of huge embedded assets.',
  },
] as const

const GUIDE_PUBLISHED = '2026-04-30T12:00:00.000Z'
const GUIDE_MODIFIED = '2026-05-11T12:00:00.000Z'

export const metadata = marketingMetadata({
  title: 'Open Graph image SEO (2026): size, Next.js, Google thumbnails & LLMs | OGKit',
  description:
    'Open Graph image size (1200×630), absolute og:image URLs, Next.js generateMetadata patterns, Facebook/LinkedIn cache refresh, Google Discover thumbnails, JSON-LD, and /llms.txt for LLM crawlers—practical OGKit guide.',
  pathname: '/blog/open-graph-images-seo-guide',
  keywords: [...GUIDE_KEYWORDS],
  article: {
    publishedTime: GUIDE_PUBLISHED,
    modifiedTime: GUIDE_MODIFIED,
    authors: [siteConfig.name],
  },
  ogImageUrl: guideOgImageUrl(),
})

const sections: { id: string; heading: string; level: 2 | 3; body: string[] }[] = [
  {
    id: 'tldr',
    heading: 'TL;DR',
    level: 2,
    body: [
      `Open Graph (OG) and Twitter/X card metadata control how your URLs look when shared in Slack, Discord, LinkedIn, iMessage, and search-driven discovery. A strong setup uses one canonical HTTPS image per URL, stable 1200×630 dimensions, readable typography at thumbnail size, and titles that still make sense when truncated.`,
      `Hosted template APIs like ${siteConfig.name} trade maximum layout freedom for operational simplicity: you pass title, subtitle, logo, and product fields as query parameters instead of maintaining Satori JSX, headless Chrome, or design-tool pipelines yourself. For Next.js teams, the usual integration point is generateMetadata on the server, which keeps secrets out of the client bundle.`,
      `Skim the rest of this guide for internal links to the HTTP reference, pricing, the live Playground, the dynamic previews use-case page, and the Next.js-specific framework guide—then ship a first preview URL in minutes using demo mode.`,
    ],
  },
  {
    id: 'why-previews-matter',
    heading: 'Why link previews matter for distribution and SEO',
    level: 2,
    body: [
      'Social networks and messengers increasingly behave like secondary search engines: the image, title, and description decide whether someone opens your tab or keeps scrolling. Even when rankings are stable, a weak preview lowers click-through from the same position because humans compare adjacent cards in the feed.',
      'From an SEO lens, previews reinforce topical relevance. When your article title, hero art, and meta description align with the query intent, you reduce pogo-sticking after the click. That alignment is easier when the preview image is generated from the same structured data you already store for the page—release name, price, author, or doc section—rather than a single static marketing banner reused everywhere.',
      'Latency and caching matter too. Crawlers and unfurlers fetch og:image as a separate HTTP resource. Deterministic URLs that include only stable fields (or a signed hash of them) help CDNs cache aggressively, which keeps Slack and LinkedIn rescrapes fast when a link is reshared weeks later.',
    ],
  },
  {
    id: 'metadata-basics',
    heading: 'The minimum viable metadata stack',
    level: 2,
    body: [
      'At the HTML layer you typically emit og:title, og:description, og:image, og:image:width, og:image:height, twitter:card, and twitter:image alongside your canonical link element. Width and height help clients reserve aspect ratio before the PNG finishes downloading, which avoids layout jump in some in-app browsers.',
      'Absolute HTTPS URLs are non-negotiable: relative og:image paths break in aggregators that resolve against the wrong host, and http URLs fail mixed-content expectations on modern clients. If your app is mounted under a path prefix, bake that prefix into outbound marketing links so canonicals, sitemaps, and image URLs stay consistent.',
      'When you evaluate vendors, ask how they handle cache headers, signed URLs for public endpoints, and per-plan quotas. Those operational details matter more than pixel-perfect gradients once you are rendering thousands of cards per month across blogs, changelogs, and programmatic landing pages.',
    ],
  },
  {
    id: 'nextjs',
    heading: 'Next.js App Router patterns that survive code review',
    level: 2,
    body: [
      'The App Router encourages colocating SEO with routes via the metadata API. Build your preview image URL in generateMetadata or a small server-only helper, assign it to openGraph.images and twitter.images, and never import API secrets into client components. That single rule prevents an entire class of security regressions when someone later refactors a page to a client boundary.',
      'If you compare maintaining opengraph-image.tsx with a hosted OG API, the trade-off is control versus toil. Custom routes shine when every page needs bespoke JSX. Template APIs shine when product, growth, and docs teams want predictable cards without waiting on a frontend deploy for every copy tweak.',
      `For a focused walkthrough with pitfalls and snippets, read the ${siteConfig.name} Next.js framework page linked below; it mirrors what we document in the HTTP API reference and pairs well with the comparison articles when you are choosing between hosted templates and in-repo Satori.`,
    ],
  },
  {
    id: 'lsi-worked-examples',
    heading: 'Worked examples: SaaS, docs, ecommerce, and changelogs',
    level: 2,
    body: [
      'SaaS marketing sites benefit from brand-forward cards: logo, short tagline, and a restrained accent color so the preview still reads when Slack shrinks it. Documentation sites often prefer code-forward or minimal templates so the page title and section name carry the signal. Ecommerce share cards should show price and product photography where policy allows, because those fields answer the first shopper question before the click.',
      'Changelog and release-note URLs are easy to neglect: teams reuse the homepage OG image and wonder why engagement is flat. A simple pattern is one card per release with the version in the title and two lines of summary text. That small habit compounds when power users subscribe to RSS or social mirrors of your feed.',
      'Internal education matters: link writers should know that editing page copy without regenerating the OG URL can leave stale previews until caches expire. Either version your query string when content changes materially or rely on a signing scheme that rotates when the underlying record updates.',
    ],
  },
  {
    id: 'mistakes',
    heading: 'Mistakes that pass CI but fail in the wild',
    level: 2,
    body: [
      'Using client-side-only metadata updates is the classic SPA pitfall: crawlers and most unfurlers do not execute your JavaScript bundle. Anything that matters for distribution must be present in the first HTML response.',
      'Another failure mode is gigantic custom fonts or unbounded text: preview renderers enforce tight timeouts. Template systems that cap line counts and font file sizes behave more predictably than unconstrained screenshot browsers on cold start.',
      'Finally, mixing testing and production keys in the same environment variables creates incidents. Keep demo mode for design reviews, signed URLs when exposing generation to the public internet, and domain allowlists when a single key must serve multiple properties.',
    ],
  },
  {
    id: 'measure',
    heading: 'How to measure whether previews are working',
    level: 2,
    body: [
      'Use official debugger tools and your own staging fetches: curl the page HTML, extract og:image, then curl the image URL and inspect content-type, cache-control, and total bytes. Large PNGs are fine at 1200×630 if compression is tuned; runaway megabytes suggest a misconfigured screenshot pipeline or lossless assets that should be quantized.',
      'Watch referral quality from social and community sites after you ship dynamic previews. You should see higher session depth when cards match destination content because visitors arrive with accurate expectations.',
      'When you are ready to automate generation in production, start with the HTTP docs, validate keys in the dashboard, and keep llms.txt in sync so coding agents pick up canonical examples without inventing hosts.',
    ],
  },
  {
    id: 'checklist',
    heading: 'Checklist before you call previews done',
    level: 2,
    body: [
      'One primary H1 on the destination page, supporting H2/H3 sections, and metadata titles that do not fight the visible headline.',
      'One OG image URL per canonical URL, absolute HTTPS, width and height meta, twitter:image mirroring og:image unless you intentionally diverge.',
      'Quotas, signing, and key rotation documented for whoever operates billing—not only the engineer who wired the first prototype.',
    ],
  },
  {
    id: 'dimensions',
    heading: 'Image dimensions and safe-area typography',
    level: 2,
    body: [
      'The consensus dimension across Open Graph scrapers is 1200×630 pixels at a 1.91:1 ratio. LinkedIn and Twitter/X render large cards at approximately that ratio; Slack and iMessage sometimes crop narrower on small viewports. Keep a 64 px safe margin on all sides and avoid pinning meaningful text within the outer 10 percent of the canvas so nothing important is clipped when clients crop to a square thumbnail in notifications or mobile previews.',
      'Font size matters more than layout cleverness. A 72–96 px headline holds up across desktop feeds, mobile browsers, and shrunk Slack thumbnails; anything under 48 px starts to blur below 400 px rendering width. Limit headlines to two lines and use a conservative line-height so rogue long titles do not overflow into logo zones or clip the author byline. When a template offers a "dark" theme, ensure body text clears WCAG AA contrast against the darkest background patch, not just the average.',
      'PNG is the default output format because every major scraper decodes it losslessly and sizes stay below a few hundred kilobytes with modern palette optimization. Avoid JPEG for text-heavy cards — chromatic compression artifacts show up first on sharp letterforms and logos. WebP and AVIF are faster but not universally supported in older unfurlers, so they should remain an option, not a default.',
    ],
  },
  {
    id: 'crawlers-llms',
    heading: 'How LLM crawlers and AI search surfaces read previews',
    level: 2,
    body: [
      'Google and Bing are no longer the only audiences for Open Graph metadata. Perplexity, ChatGPT browsing, Claude and Gemini retrieval pipelines, Cursor Docs, and other AI systems fetch HTML and extract structured data (Open Graph, Twitter cards, schema.org JSON-LD) to build citations and previews. If your og:image is a generic brand splash and your schema.org block is missing, the AI surface shows a weaker card than a competitor who spent a day on metadata — and AI users rarely scroll deeper in the result set.',
      'A robust setup gives AI crawlers three layers: a canonical HTTPS og:image (1200×630), a schema.org Article or TechArticle node with headline and description, and a text-based companion file at /llms.txt that summarizes the site in machine-readable form. Each layer reinforces the others: the image gives the UI, the JSON-LD gives the semantic summary, and the llms.txt gives crawlers a deterministic index to choose which URL to cite. OGKit already ships an llms.txt route — inspect it, extend it, and keep canonical URLs aligned with your sitemap.',
      'Operationally, this means your preview system is part of the retrieval pipeline, not just a social-share nicety. Treat og:image generation as deterministic infrastructure — stable URLs, short cache TTLs for content edits, and signed keys for public pages — so AI ranking models see the same card a human would. The same discipline that wins Google rich results increasingly wins AI citation placement.',
    ],
  },
  {
    id: 'troubleshooting',
    heading: 'Troubleshooting the most common failure modes',
    level: 2,
    body: [
      'When a preview refuses to update, the problem is almost always caching. Facebook, LinkedIn, and Slack aggressively remember the first og:image they fetched for a URL; editing the image without a cache-busting query string or a forced rescrape leaves the old card live for days. Run the Facebook Sharing Debugger, LinkedIn Post Inspector, and Twitter Card Validator after every material change to force a refresh, and consider versioning the image URL with a short content hash so CDNs see a new resource automatically.',
      'When a preview renders but looks broken (cropped text, missing logo, wrong colors), inspect two things. First, view the og:image URL directly in a browser and confirm the PNG itself is correct at full 1200×630. If the PNG is fine, the issue is with the consuming client — LinkedIn, for example, applies its own recompression and can darken thin text. Second, check that og:image:width and og:image:height meta tags match the served PNG, because some scrapers use those hints to skip aspect-ratio guessing.',
      'When the preview is simply missing, the usual culprits are a relative og:image URL, a missing Content-Type, a 4xx from the image host, or a CSP/CORP header that blocks external fetch. A final check: inspect the raw HTML of the page with curl — not a rendered view in DevTools — to confirm the metadata ships in the first response. Many SPA bugs disappear only after a server-side render is configured; otherwise the metadata lives only in client JavaScript that scrapers never execute.',
    ],
  },
]

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: GUIDE_FAQ.map((item) => ({
    '@type': 'Question',
    name: item.name,
    acceptedAnswer: { '@type': 'Answer', text: item.text },
  })),
}

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'TechArticle',
  headline: 'Open Graph image SEO: size, Next.js metadata, Google thumbnails & LLM crawlers',
  description:
    'Practical guide: 1200×630 Open Graph and Twitter/X images, absolute og:image URLs, Next.js generateMetadata, platform cache refresh, JSON-LD, and /llms.txt for AI crawlers.',
  inLanguage: 'en-US',
  datePublished: GUIDE_PUBLISHED,
  dateModified: GUIDE_MODIFIED,
  image: [guideOgImageUrl()],
  author: { '@type': 'Organization', name: siteConfig.name, url: absoluteSiteUrl('') },
  publisher: { '@type': 'Organization', name: siteConfig.name, url: absoluteSiteUrl('') },
  mainEntityOfPage: { '@type': 'WebPage', '@id': absoluteSiteUrl('/blog/open-graph-images-seo-guide') },
  isPartOf: { '@type': 'WebSite', name: siteConfig.name, url: absoluteSiteUrl('') },
  keywords: GUIDE_KEYWORDS.join(', '),
}

function OgCardVisual() {
  return (
    <figure className="not-prose mt-10 overflow-hidden rounded-2xl border bg-slate-950 shadow-2xl shadow-slate-950/15">
      <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="p-6 sm:p-8">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">
            <span>1200×630 PNG</span>
            <span>og:image</span>
          </div>
          <div className="mt-6 rounded-[1.4rem] border border-white/10 bg-[#101216] p-6 shadow-inner">
            <div className="h-24 w-24 rounded-3xl bg-gradient-to-br from-cyan-300 via-blue-500 to-violet-600 shadow-lg shadow-cyan-500/20" />
            <h2 className="mt-8 max-w-md text-4xl font-black tracking-tight text-white">How we shipped launch cards</h2>
            <p className="mt-3 text-sm text-slate-300">Dynamic Open Graph images from one API URL</p>
            <div className="mt-8 flex items-center justify-between text-xs text-slate-500">
              <span>by OGKit</span>
              <span className="font-bold text-slate-400">OGKit</span>
            </div>
          </div>
        </div>
        <figcaption className="border-t border-white/10 bg-white/[0.04] p-6 text-sm leading-relaxed text-slate-300 lg:border-l lg:border-t-0">
          <p className="font-semibold text-white">What crawlers should see</p>
          <p className="mt-2">
            A canonical HTTPS preview image, matching <code className="rounded bg-white/10 px-1 py-0.5 font-mono">og:title</code>, and
            structured data that repeats the same article intent. This is the visual contract for Google thumbnails,
            Slack unfurls, LinkedIn cards, and LLM browsing surfaces.
          </p>
        </figcaption>
      </div>
    </figure>
  )
}

function MetadataFlowVisual() {
  const steps = [
    ['Page data', 'title, summary, author'],
    ['OGKit URL', '/api/og/article?...'],
    ['1200×630 PNG', 'cached image bytes'],
    ['Distribution', 'Google, Slack, LLMs'],
  ] as const
  return (
    <figure className="not-prose mt-8 rounded-2xl border bg-white p-5 shadow-sm">
      <figcaption className="text-sm font-semibold text-foreground">Metadata flow: from page content to visible previews</figcaption>
      <div className="mt-4 grid gap-3 md:grid-cols-4">
        {steps.map(([title, copy], index) => (
          <div key={title} className="relative rounded-xl border bg-muted/30 p-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-950 text-sm font-bold text-white">
              {index + 1}
            </div>
            <h3 className="mt-4 text-sm font-semibold">{title}</h3>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{copy}</p>
          </div>
        ))}
      </div>
    </figure>
  )
}

function SeoExamplePanels() {
  const examples = [
    ['Good URL', 'https://www.webmorp.art/api/og/article?title=Open+Graph+SEO&demo=1'],
    ['Bad preview', 'One generic homepage banner reused on every article and changelog.'],
    ['Next.js hook', 'generateMetadata() returns openGraph.images + twitter.images on the server.'],
  ] as const
  return (
    <figure className="not-prose mt-8 grid gap-3 md:grid-cols-3">
      {examples.map(([label, value]) => (
        <div key={label} className="rounded-2xl border bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
          <p className="mt-3 break-words font-mono text-xs leading-relaxed text-foreground">{value}</p>
        </div>
      ))}
    </figure>
  )
}

export default function OpenGraphSeoGuidePage() {
  const breadcrumbLd = breadcrumbListJsonLd([
    { name: 'Blog', path: '/blog' },
    { name: 'Open Graph image SEO guide', path: '/blog/open-graph-images-seo-guide' },
  ])
  return (
    <div className="container max-w-3xl py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <article className="prose prose-sm max-w-none dark:prose-invert">
        <p className="text-sm font-medium text-muted-foreground not-prose">Guide · Updated May 2026</p>
        <h1 className="not-prose mt-2 text-3xl font-bold tracking-tight">
          Open Graph image SEO: size, Next.js metadata, Google thumbnails &amp; LLM crawlers
        </h1>
        <p className="lead not-prose mt-4 text-base text-muted-foreground">
          Answers the queries teams actually type into Google and into LLMs: <strong className="font-medium text-foreground">open graph image size</strong>,{' '}
          <strong className="font-medium text-foreground">og:image</strong> vs <strong className="font-medium text-foreground">twitter:image</strong>,{' '}
          <strong className="font-medium text-foreground">Next.js generateMetadata</strong>, Facebook/LinkedIn cache refresh, Google Search &amp; Discover
          thumbnails, and what to put in <strong className="font-medium text-foreground">JSON-LD</strong> plus <strong className="font-medium text-foreground">/llms.txt</strong> so AI crawlers cite you correctly.
        </p>
        <OgCardVisual />

        <section className="not-prose mt-10 rounded-lg border bg-muted/30 p-6">
          <h2 className="text-xl font-semibold">Recommended implementation path</h2>
          <div className="mt-4 space-y-4 text-sm leading-relaxed text-muted-foreground">
            <p>
              Start in the{' '}
              <Link className="text-primary underline" href={withBasePath('/playground')}>
                Playground
              </Link>{' '}
              with <code className="font-mono text-foreground">demo=1</code> so designers and engineers can agree on the
              card before production keys exist. Then wire the final URL using the{' '}
              <Link className="text-primary underline" href={withBasePath('/docs')}>
                HTTP API reference
              </Link>{' '}
              and decide whether the page needs public{' '}
              <Link className="text-primary underline" href={withBasePath('/pricing')}>
                signed URLs
              </Link>{' '}
              or a simple server-side key.
            </p>
            <p>
              For Next.js teams, the fastest route is the{' '}
              <Link className="text-primary underline" href={withBasePath('/for/nextjs')}>
                App Router guide
              </Link>
              : build the image URL in <code className="font-mono text-foreground">generateMetadata</code>, mirror it in
              <code className="font-mono text-foreground"> twitter.images</code>, and validate the deployed page with the{' '}
              <Link className="text-primary underline" href={withBasePath('/tools')}>
                preview debugging tools
              </Link>
              . If you are still choosing between in-repo rendering and hosted URLs, compare{' '}
              <Link className="text-primary underline" href={withBasePath('/compare/ogkit-vs-vercel-og')}>
                OGKit vs @vercel/og
              </Link>{' '}
              and{' '}
              <Link className="text-primary underline" href={withBasePath('/compare/satori-vs-puppeteer')}>
                Satori vs Puppeteer
              </Link>
              .
            </p>
          </div>
        </section>
        <MetadataFlowVisual />

        {sections.map((s) =>
          s.level === 2 ? (
            <section key={s.id} id={s.id} className="not-prose mt-12">
              <h2 className="text-2xl font-semibold tracking-tight">{s.heading}</h2>
              <div className="mt-4 space-y-4 text-sm leading-relaxed text-muted-foreground">
                {s.body.map((p, i) => (
                  <p key={`${s.id}-${i}`}>{p}</p>
                ))}
              </div>
              {s.id === 'nextjs' ? <SeoExamplePanels /> : null}
            </section>
          ) : (
            <section key={s.id} id={s.id} className="not-prose mt-10">
              <h3 className="text-xl font-semibold tracking-tight">{s.heading}</h3>
              <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
                {s.body.map((p, i) => (
                  <p key={`${s.id}-${i}`}>{p}</p>
                ))}
              </div>
            </section>
          ),
        )}

        <section className="not-prose mt-12 rounded-lg border bg-muted/30 p-6">
          <h2 className="text-xl font-semibold">Where to go next on {siteConfig.name}</h2>
          <ul className="mt-4 list-inside list-disc space-y-2 text-sm text-muted-foreground">
            <li>
              <Link className="text-primary underline" href={withBasePath('/docs')}>
                HTTP API reference
              </Link>{' '}
              for templates, query parameters, errors, and authentication.
            </li>
            <li>
              <Link className="text-primary underline" href={withBasePath('/playground')}>
                Playground
              </Link>{' '}
              to visually validate cards before you wire metadata.
            </li>
            <li>
              <Link className="text-primary underline" href={withBasePath('/pricing')}>
                Pricing
              </Link>{' '}
              for quotas, crypto checkout, and signed URL availability by plan.
            </li>
            <li>
              <Link className="text-primary underline" href={withBasePath('/for/nextjs')}>
                Next.js guide
              </Link>{' '}
              for App Router snippets and pitfalls.
            </li>
            <li>
              <Link className="text-primary underline" href={withBasePath('/use-case/dynamic-social-preview-images')}>
                Dynamic social preview images
              </Link>{' '}
              for a deeper use-case narrative and mistake list.
            </li>
            <li>
              <Link className="text-primary underline" href={withBasePath('/compare/ogkit-vs-vercel-og')}>
                OGKit vs @vercel/og
              </Link>{' '}
              when you are deciding between hosted URLs and in-repo ImageResponse routes.
            </li>
            <li>
              <Link className="text-primary underline" href={withBasePath('/tools')}>
                Tools and validators
              </Link>{' '}
              for third-party debugger links you can hand to non-engineers.
            </li>
            <li>
              <Link className="text-primary underline" href={withBasePath('/contact')}>
                Contact
              </Link>{' '}
              if you need help with billing, keys, or template behavior.
            </li>
          </ul>
        </section>

        <section id="faq" className="not-prose mt-16 scroll-mt-24">
          <h2 className="text-2xl font-semibold tracking-tight">Frequently asked questions</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Same Q&amp;A as the <code className="font-mono text-foreground">FAQPage</code> JSON-LD on this route—helpful for people, Google rich results, and
            LLM retrieval.
          </p>
          <dl className="mt-8 space-y-8">
            {GUIDE_FAQ.map((item) => (
              <div key={item.name}>
                <dt className="text-base font-semibold text-foreground">{item.name}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.text}</dd>
              </div>
            ))}
          </dl>
        </section>
      </article>

      <div className="mt-16">
        <FinishCta />
      </div>
    </div>
  )
}
