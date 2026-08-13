import Link from 'next/link'
import { withBasePath } from '@/config/paths'
import { siteConfig } from '@/config/site'
import { marketingMetadata } from '@/lib/marketing-metadata'
import { breadcrumbListJsonLd } from '@/lib/breadcrumbs'
import { FinishCta } from '@/components/marketing/finish-cta'

export const metadata = marketingMetadata({
  title: 'OGKit guides — quickstart, signed URLs, auto OG, caching, MCP',
  description:
    'OGKit guides: 60-second quickstart, HMAC signed URLs, /api/og/auto, Cache-Control and rescrape, appearance, Cursor MCP, and Satori vs Puppeteer for OG images.',
  pathname: '/guides',
})

const GUIDES = [
  {
    href: '/guides/quickstart',
    title: 'Quickstart — first OG image in 60 seconds',
    desc: 'Playground → copy URL → HTML/Next.js meta → Facebook Debugger. No signup required.',
  },
  {
    href: '/guides/signed-urls',
    title: 'Signed URLs & domain allowlists',
    desc: 'HMAC-SHA256 signatures, Node/Python examples, dashboard toggles, error codes.',
  },
  {
    href: '/guides/auto-og',
    title: 'Auto OG from a page URL',
    desc: 'GET /api/og/auto — extracted metadata, overrides, safety limits, Next.js pattern.',
  },
  {
    href: '/guides/caching-and-rescrape',
    title: 'Caching & rescrape',
    desc: 'Cache-Control, CDN keys, Facebook/LinkedIn/Slack refresh workflow.',
  },
  {
    href: '/guides/appearance',
    title: 'Theme, accent, pattern, fonts',
    desc: 'Brand the minimal and gradient templates without a custom renderer.',
  },
  {
    href: '/guides/mcp',
    title: 'MCP for Cursor & AI agents',
    desc: 'Connect /api/mcp, tools list, plugin bundle, safe agent workflow.',
  },
  {
    href: '/guides/og-image-rendering',
    title: 'Satori vs Puppeteer for OG images',
    desc: 'When to own a renderer vs use a hosted 1200×630 template API.',
  },
] as const

export default function GuidesIndexPage() {
  const breadcrumbLd = breadcrumbListJsonLd([{ name: 'Guides', path: '/guides' }])
  return (
    <div className="container max-w-3xl space-y-10 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <header>
        <h1 className="font-heading text-4xl font-bold tracking-tight">Guides</h1>
        <p className="mt-3 text-muted-foreground">
          Operational depth for {siteConfig.name} — beyond the HTTP reference. For SEO narrative, see the{' '}
          <Link href={withBasePath('/blog/open-graph-images-seo-guide')} className="text-primary underline">
            Open Graph SEO guide
          </Link>
          .
        </p>
      </header>
      <ul className="space-y-4">
        {GUIDES.map((g) => (
          <li key={g.href} className="border-b border-border pb-4">
            <Link href={withBasePath(g.href)} className="group block">
              <h2 className="font-heading text-xl font-semibold tracking-tight group-hover:text-primary">{g.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{g.desc}</p>
            </Link>
          </li>
        ))}
      </ul>
      <FinishCta />
    </div>
  )
}
