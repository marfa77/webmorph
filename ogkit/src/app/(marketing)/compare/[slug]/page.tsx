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
  return {
    title: c.title,
    description: c.description,
  }
}

export default function ComparePage({ params }: Props) {
  if (!ALLOWED.has(params.slug)) notFound()
  const c = COPY[params.slug]!
  return (
    <div className="container max-w-4xl space-y-12 py-12">
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
