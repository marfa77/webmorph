import Link from 'next/link'
import { withBasePath } from '@/config/paths'
import { siteConfig } from '@/config/site'
import { marketingMetadata } from '@/lib/marketing-metadata'
import { breadcrumbListJsonLd } from '@/lib/breadcrumbs'
import { FinishCta } from '@/components/marketing/finish-cta'

export const metadata = marketingMetadata({
  title: 'OGKit guides — signed URLs, auto OG, caching, appearance, MCP',
  description:
    'Deep OGKit guides: HMAC signed URLs, /api/og/auto metadata, Cache-Control and rescrape, theme/accent/pattern/fonts, and Cursor MCP setup.',
  pathname: '/guides',
})

const GUIDES = [
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
] as const

export default function GuidesIndexPage() {
  const breadcrumbLd = breadcrumbListJsonLd([{ name: 'Guides', path: '/guides' }])
  return (
    <div className="container max-w-3xl space-y-10 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <header>
        <h1 className="font-display text-4xl font-bold tracking-tight">Guides</h1>
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
              <h2 className="font-display text-xl font-semibold tracking-tight group-hover:text-primary">{g.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{g.desc}</p>
            </Link>
          </li>
        ))}
      </ul>
      <FinishCta />
    </div>
  )
}
