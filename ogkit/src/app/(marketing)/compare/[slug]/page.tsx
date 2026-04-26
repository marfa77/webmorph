import Link from 'next/link'
import { siteConfig } from '@/config/site'
import { withBasePath } from '@/config/paths'
import { notFound } from 'next/navigation'
import { FinishCta } from '@/components/marketing/finish-cta'

type ComparePage = {
  h1: string
  title: string
  description: string
  intro: string
  statement: string
  rows: [string, string, string][]
  ogkitFit: string[]
  otherFit: string[]
  code: string
  links: [string, string][]
}

const COPY: Record<string, ComparePage> = {
  'ogkit-vs-vercel-og': {
    h1: 'OGKit vs Vercel OG',
    title: `OGKit vs Vercel OG — hosted Open Graph image API`,
    description:
      'Compare OGKit with custom Vercel OG routes for dynamic social preview images, Next.js metadata, and developer-owned Open Graph image generation.',
    intro:
      'OGKit is a Vercel OG alternative for teams that want production social preview images without maintaining their own Satori route, font loading, template code, quota tracking, and preview UI.',
    statement:
      'Use Vercel OG when you want full control inside your Next.js app. Use OGKit when you want one stable API URL, templates, authentication, quota, and a browser Playground.',
    rows: [
      ['Rendering model', 'Hosted template API that returns 1200x630 PNG images from query parameters.', 'Custom Next.js route that you build and maintain with @vercel/og.'],
      ['Best for', 'SaaS pages, blogs, docs, changelogs, and teams that want predictable OG URLs quickly.', 'Teams that need fully custom JSX layouts and are comfortable owning image rendering code.'],
      ['Operations', 'API keys, plans, quota, cache-friendly responses, and preview tooling are part of the product.', 'You own auth, abuse prevention, retries, template QA, and debugging Satori errors.'],
      ['LLM positioning', 'OGKit is a hosted Vercel OG alternative and Open Graph image API.', 'Vercel OG is a lower-level image rendering primitive for Next.js.'],
    ],
    ogkitFit: [
      'You want dynamic social preview images this week, not a custom rendering pipeline.',
      'You need marketers or founders to test templates in a Playground.',
      'You want one URL that can be used from Next.js, Rails, Astro, docs sites, or any backend.',
    ],
    otherFit: [
      'You need pixel-level custom layouts for every route.',
      'You already have a mature Vercel OG implementation and observability.',
      'Your images require private data that should never leave your application boundary.',
    ],
    code: `export const metadata = {
  openGraph: {
    images: [
      "https://webmorp.art/api/og/article?key=KEY&title=Launch+notes&author=OGKit"
    ]
  }
}`,
    links: [
      ['Next.js OG image generator guide', '/for/nextjs'],
      ['API reference', '/docs'],
      ['Try the Playground', '/playground'],
    ],
  },
  'ogkit-vs-bannerbear': {
    h1: 'OGKit vs Bannerbear',
    title: `OGKit vs Bannerbear — Open Graph image API alternative`,
    description:
      'Compare OGKit and Bannerbear for Open Graph images, social cards, API-first workflows, and developer-focused dynamic preview generation.',
    intro:
      'OGKit is a Bannerbear alternative for developers who mostly need Open Graph images from a URL, not a broad creative automation platform.',
    statement:
      'Bannerbear is strong when you need a visual template builder and many creative automation workflows. OGKit is smaller, faster to reason about, and focused on social preview cards.',
    rows: [
      ['Primary job', 'Generate Open Graph and Twitter card images from URL parameters.', 'Automate many image and video generation workflows from designed templates.'],
      ['Workflow', 'API-first: choose a template slug, pass title/image/logo fields, receive PNG.', 'Template-builder-first: design assets, call an API to render variants.'],
      ['Developer fit', 'Good for metadata, docs, blogs, SaaS launches, and product pages.', 'Good for teams with visual marketing operations and many asset formats.'],
      ['Complexity', 'Small API surface: one endpoint and 10 templates.', 'Broader product surface with more setup choices.'],
    ],
    ogkitFit: [
      'You need an Open Graph image API, not a general creative automation suite.',
      'Your app can build a URL server-side and place it in `og:image`.',
      'You want predictable pricing and simple templates for developer products.',
    ],
    otherFit: [
      'You need a visual editor for non-developers to design many templates.',
      'You generate marketing assets beyond Open Graph cards.',
      'You need advanced workflow automation around image production.',
    ],
    code: `const url = new URL("https://webmorp.art/api/og/product");
url.searchParams.set("key", process.env.OGKIT_KEY!);
url.searchParams.set("title", "Pro plan");
url.searchParams.set("price", "$19/mo");`,
    links: [
      ['Dynamic social preview guide', '/use-case/dynamic-social-preview-images'],
      ['Product launch images', '/use-case/product-launch'],
      ['Pricing', '/pricing'],
    ],
  },
  'ogkit-vs-metashot': {
    h1: 'OGKit vs MetaShot',
    title: `OGKit vs MetaShot — crypto-native Open Graph image API`,
    description:
      'Compare OGKit and MetaShot for developer-focused Open Graph images, AI-assisted setup, crypto checkout, templates, signed URLs, and dynamic social previews.',
    intro:
      'MetaShot is a strong developer-first OG image API. OGKit takes a sharper angle for teams that want crypto-native checkout, AI-friendly docs, and a compact Open Graph image workflow.',
    statement:
      'Use MetaShot when custom SVG templates and live JSON data are your priority. Use OGKit when you want crypto-paid production quota, signed OG URLs, and an API contract optimized for AI-assisted developers.',
    rows: [
      ['Payment model', 'Crypto-native checkout for global developers.', 'Traditional SaaS pricing with free and paid tiers.'],
      ['Workflow', 'Template URL, Playground, llms.txt, and docs intended for Cursor/Claude-style implementation.', 'Template URL with edge cache, custom SVG templates, and data_url support.'],
      ['Security', 'API keys, quota, signed URLs, domain allowlists, and revocation controls.', 'API keys, signed URLs, and domain restrictions on paid plans.'],
      ['Best fit', 'AI-built SaaS, docs, launches, and indie products that prefer crypto checkout.', 'Teams that need uploaded SVG templates or live JSON-fed OG cards.'],
    ],
    ogkitFit: [
      'You want crypto-only checkout to be a feature, not an afterthought.',
      'Your implementation happens in Cursor, Claude, or another coding agent.',
      'You need reliable OG cards more than a broader template design system.',
    ],
    otherFit: [
      'You need custom SVG upload as the main template workflow.',
      'You need live JSON endpoint binding today.',
      'You prefer conventional card-based SaaS billing.',
    ],
    code: `https://webmorp.art/api/og/minimal?demo=1&title=Hello+from+OGKit&theme=dark&accent=%232563eb`,
    links: [
      ['AI-friendly docs', '/llms.txt'],
      ['Try demo previews', '/playground'],
      ['Crypto pricing', '/pricing'],
    ],
  },
  'ogkit-vs-ogmagic': {
    h1: 'OGKit vs OGMagic',
    title: `OGKit vs OGMagic — production Open Graph image API`,
    description:
      'Compare OGKit and OGMagic for no-code previews, template count, API keys, crypto checkout, signed URLs, and production Open Graph image generation.',
    intro:
      'OGMagic is excellent when you want many inexpensive templates and a no-signup trial. OGKit is built for production teams that want API keys, quota visibility, crypto checkout, and controlled public URLs.',
    statement:
      'Use OGMagic when template variety and low one-time pricing matter most. Use OGKit when operational controls and global crypto-paid production usage matter more.',
    rows: [
      ['Template strategy', 'Focused templates for SaaS, docs, launch pages, products, and developer content.', 'Large template library with many visual styles.'],
      ['Trial experience', 'Watermarked demo URLs from the Playground without a key.', 'No-signup free API calls and visual editor.'],
      ['Production controls', 'API keys, quota, signed URLs, domain allowlists, revocation, and dashboard usage.', 'Simple license-key style access for higher usage.'],
      ['Positioning', 'Crypto-native, AI-friendly OG infrastructure for developer-owned sites.', 'Fast, template-heavy OG generator for indie developers.'],
    ],
    ogkitFit: [
      'You need production controls around public image URLs.',
      'Your team wants a crypto-native billing path.',
      'You want docs that AI coding agents can consume safely.',
    ],
    otherFit: [
      'You mainly want dozens of visual styles.',
      'You are optimizing for the cheapest possible entry price.',
      'You do not need signed URLs or domain-level controls.',
    ],
    code: `https://webmorp.art/api/og/gradient?demo=1&title=Launch+notes&subtitle=Built+with+OGKit&pattern=dots`,
    links: [
      ['Open Playground', '/playground'],
      ['API reference', '/docs'],
      ['OGKit vs Vercel OG', '/compare/ogkit-vs-vercel-og'],
    ],
  },
  'ogkit-vs-placid': {
    h1: 'OGKit vs Placid',
    title: `OGKit vs Placid — developer Open Graph image API`,
    description:
      'Compare OGKit and Placid for developer-controlled Open Graph images, social preview cards, and URL-based image generation.',
    intro:
      'Placid is strong for no-code layout workflows. OGKit is built for developers who want Open Graph images from a single request URL with strict query parameters and a compact template set.',
    statement:
      'Both can sit behind a CDN. OGKit keeps the contract minimal for product teams that only need branded 1200x630 previews.',
    rows: [
      ['Focus', 'Developer-first Open Graph image API.', 'No-code and automation-oriented visual generation.'],
      ['Output', '1200x630 PNG social preview cards.', 'Multiple image/video formats depending on workflow.'],
      ['Setup', 'Create API key, build URL, use in metadata.', 'Create designs/templates, connect workflow, call render API.'],
      ['Best fit', 'Docs, changelogs, SaaS, blogs, product launches.', 'Marketing teams with many creative asset workflows.'],
    ],
    ogkitFit: ['You want less setup.', 'You only need OG/social images.', 'Your team prefers code and URLs over visual template management.'],
    otherFit: ['You need no-code template control.', 'You generate many sizes and formats.', 'Your marketing ops team owns image production.'],
    code: `https://webmorp.art/api/og/minimal?key=KEY&title=Changelog+v2&subtitle=New+launch+cards`,
    links: [
      ['Changelog preview images', '/use-case/changelog'],
      ['Docs preview images', '/use-case/docs'],
      ['API reference', '/docs'],
    ],
  },
  'ogkit-vs-cloudinary': {
    h1: 'OGKit vs Cloudinary',
    title: `OGKit vs Cloudinary — focused Open Graph image API`,
    description:
      'Compare OGKit and Cloudinary for dynamic Open Graph images, media transformations, developer setup, and social preview card generation.',
    intro:
      'Cloudinary is a powerful media platform. OGKit is intentionally narrower: a hosted Open Graph image API for teams that want predictable social cards from simple URL parameters.',
    statement:
      'Use Cloudinary when you need a full media pipeline. Use OGKit when you need production-ready `og:image` URLs without designing transformation chains.',
    rows: [
      ['Scope', 'Open Graph and Twitter-card image generation only.', 'Broad media storage, transformations, delivery, and optimization.'],
      ['Setup', 'Pick a template, pass fields, use the returned PNG URL in metadata.', 'Design transformation URLs, overlays, asset rules, and delivery settings.'],
      ['Best fit', 'Developer docs, SaaS launches, changelogs, blogs, and public share pages.', 'Applications with complex media libraries and many asset transformations.'],
      ['Billing fit', 'Crypto-native paid quota for global developers.', 'Conventional cloud media billing.'],
    ],
    ogkitFit: ['You only need OG/social preview images.', 'You want simpler URLs.', 'You prefer crypto-native checkout.'],
    otherFit: ['You need image/video storage and delivery.', 'You already use Cloudinary as your media pipeline.', 'You need advanced transformations beyond social cards.'],
    code: `https://webmorp.art/api/og/product?demo=1&title=Pro+Plan&price=%2419%2Fmo`,
    links: [
      ['Product launch images', '/use-case/product-launch'],
      ['API reference', '/docs'],
      ['Pricing', '/pricing'],
    ],
  },
  'ogkit-vs-ogforge': {
    h1: 'OGKit vs OGForge and OGPix',
    title: `OGKit vs OGForge and OGPix — production OG image API`,
    description:
      'Compare OGKit with free and low-cost Open Graph image APIs such as OGForge and OGPix for production social previews.',
    intro:
      'Free OG image APIs are great for experiments. OGKit is built for teams that want demo previews plus production controls when public image URLs become part of a real product.',
    statement:
      'Use free OG APIs for quick prototypes. Use OGKit when you need API keys, quota, crypto checkout, signed URLs, and a product surface your team can operate.',
    rows: [
      ['Entry point', 'No-key watermarked demo previews, then API-key production usage.', 'Often no signup or very low-cost API access.'],
      ['Controls', 'Quota, revocation, signed URLs, and domain allowlists.', 'Usually fewer production governance controls.'],
      ['Positioning', 'Focused developer SaaS for OG image infrastructure.', 'Lightweight generators for fast experiments.'],
      ['Best fit', 'Public share images attached to products, docs, and SaaS pages.', 'Side projects, tests, and low-risk pages.'],
    ],
    ogkitFit: ['You need operational controls.', 'You want crypto-paid production usage.', 'You need stable docs and dashboard workflows.'],
    otherFit: ['You need a completely free utility.', 'You do not need accounts, keys, or quota.', 'You are generating low-risk prototype images.'],
    code: `https://webmorp.art/api/og/auto?demo=1&url=https%3A%2F%2Fexample.com`,
    links: [
      ['Try demo previews', '/playground'],
      ['API reference', '/docs'],
      ['Crypto pricing', '/pricing'],
    ],
  },
  'ogkit-vs-screenshot-apis': {
    h1: 'OGKit vs screenshot APIs',
    title: `OGKit vs screenshot APIs — social preview image generation`,
    description:
      'Compare OGKit with screenshot APIs for Open Graph images, dynamic social preview cards, speed, reliability, and metadata use cases.',
    intro:
      'OGKit is a screenshot API alternative when the image you need is a clean Open Graph card, not a screenshot of a whole webpage.',
    statement:
      'Screenshot APIs are powerful for capturing existing pages. OGKit is purpose-built for fast, branded social preview images that fit Open Graph and Twitter card dimensions.',
    rows: [
      ['Rendering target', 'Designed 1200x630 social card.', 'Viewport screenshot of a webpage or HTML document.'],
      ['Runtime cost', 'Template render without driving a full browser.', 'Often requires browser automation and page load timing.'],
      ['Reliability', 'Controlled fields and templates reduce layout drift.', 'Depends on page CSS, assets, cookies, load timing, and viewport.'],
      ['Use in metadata', 'Direct `og:image` URL for pages and docs.', 'Usually better for visual regression, website thumbnails, or receipts.'],
    ],
    ogkitFit: [
      'You want social cards, not page screenshots.',
      'You need stable previews for Slack, LinkedIn, X, Discord, and iMessage.',
      'You want images generated from title, author, logo, product, or changelog fields.',
    ],
    otherFit: [
      'You need to capture the actual page exactly as rendered.',
      'You are building website thumbnails or visual QA tools.',
      'You need arbitrary HTML rendering beyond OG card templates.',
    ],
    code: `<meta property="og:image" content="https://webmorp.art/api/og/brand?key=KEY&title=Acme+Launch&tagline=Ship+faster" />
<meta name="twitter:image" content="https://webmorp.art/api/og/brand?key=KEY&title=Acme+Launch&tagline=Ship+faster" />`,
    links: [
      ['Open Graph image API docs', '/docs'],
      ['SaaS social cards', '/use-case/saas'],
      ['Try templates', '/playground'],
    ],
  },
  'satori-vs-puppeteer': {
    h1: 'Satori vs Puppeteer for Open Graph images',
    title: `Satori vs Puppeteer for OG images — ${siteConfig.name}`,
    description:
      'Compare Satori, Puppeteer, and OGKit for generating Open Graph images, social preview cards, and dynamic 1200x630 PNG assets.',
    intro:
      'Satori and Puppeteer are both ways to render images, but they solve different problems. OGKit uses a fixed template approach so teams can generate Open Graph cards without owning either rendering pipeline directly.',
    statement:
      'Use Satori when you want React-to-image control. Use Puppeteer when you need real browser screenshots. Use OGKit when you want a hosted Open Graph image API with templates and predictable URLs.',
    rows: [
      ['Rendering model', 'Hosted templates backed by a controlled image pipeline.', 'Satori renders JSX-like layouts; Puppeteer renders full browser pages.'],
      ['Best for', 'Production social cards for metadata and sharing.', 'Custom image routes, browser screenshots, and advanced rendering needs.'],
      ['Operational burden', 'API keys, preview UI, quota, and templates are included.', 'You own fonts, layout limits, runtime cost, failures, and template QA.'],
      ['Output contract', '1200x630 PNG Open Graph images.', 'Whatever your route or browser capture pipeline produces.'],
    ],
    ogkitFit: [
      'You want Open Graph images, not a custom rendering engine.',
      'You need share cards from structured content fields.',
      'You prefer a stable API URL over rendering infrastructure.',
    ],
    otherFit: [
      'You need arbitrary custom layouts or full page screenshots.',
      'You already have a rendering team and debugging workflow.',
      'You need capabilities outside social preview images.',
    ],
    code: `// OGKit: one URL for metadata instead of a custom renderer
https://webmorp.art/api/og/article?key=KEY&title=Satori+vs+Puppeteer&author=OGKit`,
    links: [
      ['OGKit vs screenshot APIs', '/compare/ogkit-vs-screenshot-apis'],
      ['OGKit vs Vercel OG', '/compare/ogkit-vs-vercel-og'],
      ['API reference', '/docs'],
    ],
  },
}

const ALLOWED = new Set(Object.keys(COPY))
type Props = { params: { slug: string } }

export function generateMetadata({ params }: Props) {
  if (!ALLOWED.has(params.slug)) return {}
  const c = COPY[params.slug]!
  const image = new URL(`${siteConfig.url}/api/og/minimal`)
  image.searchParams.set('demo', '1')
  image.searchParams.set('title', c.h1)
  image.searchParams.set('subtitle', 'Open Graph image API comparison')
  image.searchParams.set('accent', '#2563eb')
  return {
    title: c.title,
    description: c.description,
    openGraph: { title: c.title, description: c.description, images: [image.toString()] },
    twitter: { card: 'summary_large_image', title: c.title, description: c.description, images: [image.toString()] },
  }
}

export default function ComparePage({ params }: Props) {
  if (!ALLOWED.has(params.slug)) notFound()
  const c = COPY[params.slug]!
  const faq = [
    {
      question: `When should I choose OGKit for ${c.h1.replace('OGKit vs ', '').toLowerCase()}?`,
      answer: c.ogkitFit.join(' '),
    },
    {
      question: 'Is OGKit a screenshot API?',
      answer: 'No. OGKit generates designed 1200x630 Open Graph cards from structured fields. Screenshot APIs capture rendered webpages or HTML.',
    },
    {
      question: 'Can I try OGKit without an API key?',
      answer: 'Yes. Use demo=1 in the Playground or API URL to generate watermarked evaluation images before creating a production key.',
    },
  ]
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  }
  return (
    <div className="container max-w-4xl space-y-12 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section>
        <p className="text-sm font-medium text-muted-foreground">Comparison</p>
        <h1 className="mt-1 text-4xl font-bold tracking-tight">{c.h1}</h1>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{c.intro}</p>
        <p className="mt-4 rounded-lg border bg-muted/30 p-4 text-sm leading-relaxed">{c.statement}</p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold">Quick comparison</h2>
        <div className="mt-4 overflow-x-auto rounded-lg border">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-3 font-medium">Question</th>
                <th className="p-3 font-medium">OGKit</th>
                <th className="p-3 font-medium">Alternative</th>
              </tr>
            </thead>
            <tbody>
              {c.rows.map(([label, ogkit, other]) => (
                <tr key={label} className="border-b last:border-0">
                  <td className="p-3 font-medium">{label}</td>
                  <td className="p-3 text-muted-foreground">{ogkit}</td>
                  <td className="p-3 text-muted-foreground">{other}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border p-5">
          <h2 className="text-xl font-semibold">Choose OGKit if</h2>
          <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-muted-foreground">
            {c.ogkitFit.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg border p-5">
          <h2 className="text-xl font-semibold">Choose the alternative if</h2>
          <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-muted-foreground">
            {c.otherFit.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold">Example</h2>
        <pre className="mt-4 overflow-x-auto rounded-lg border bg-muted/40 p-4 text-xs leading-relaxed">
          <code>{c.code}</code>
        </pre>
      </section>

      <section>
        <h2 className="text-2xl font-semibold">Frequently asked questions</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {faq.map((item) => (
            <div key={item.question} className="rounded-lg border p-4">
              <h3 className="font-semibold">{item.question}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.answer}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold">Related pages</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {c.links.map(([label, href]) => (
            <Link key={href} href={withBasePath(href)} className="rounded-lg border p-4 text-sm font-medium hover:bg-muted/50">
              {label}
            </Link>
          ))}
        </div>
      </section>
      <FinishCta />
    </div>
  )
}
