import Link from 'next/link'
import { withBasePath } from '@/config/paths'
import { siteConfig } from '@/config/site'
import { marketingMetadata } from '@/lib/marketing-metadata'
import { breadcrumbListJsonLd } from '@/lib/breadcrumbs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export const metadata = marketingMetadata({
  title: 'OGKit tools — Playground, API docs & link preview checkers',
  description:
    'Playground, HTTP API docs, opengraph.xyz-style debuggers, and Twitter/X Cards references — everything you need to validate Open Graph images before you ship.',
  pathname: '/tools',
})

const breadcrumbLd = breadcrumbListJsonLd([{ name: 'Tools', path: '/tools' }])

const items = [
  {
    href: '/playground',
    title: 'Playground',
    desc: 'Pick a template, fill in fields, and see a 1200×630 preview with a copyable image URL.',
  },
  {
    href: '/docs',
    title: 'API reference',
    desc: 'All templates, query parameters, authentication, and error codes in one place.',
  },
  {
    href: '/blog/open-graph-images-seo-guide',
    title: 'Open Graph images guide',
    desc: 'Long-form SEO walkthrough: metadata, Next.js patterns, caching, mistakes, and internal links to the rest of the site.',
  },
] as const

const external: { href: string; label: string; desc: string }[] = [
  {
    href: 'https://www.opengraph.xyz',
    label: 'opengraph.xyz',
    desc: 'Paste a URL and see exactly how Slack, iMessage, and social networks will unfurl the og:image and title tags.',
  },
  {
    href: 'https://developer.twitter.com/en/docs/twitter-for-websites/cards',
    label: 'Twitter (X) Cards docs',
    desc: 'Official Twitter Card documentation — required tags for summary_large_image, player cards, and app cards.',
  },
  {
    href: 'https://developers.facebook.com/tools/debug/',
    label: 'Facebook Sharing Debugger',
    desc: 'Force Facebook and Instagram to re-scrape updated og:image and og:title metadata after a deployment.',
  },
  {
    href: 'https://cards-dev.twitter.com/validator',
    label: 'X (Twitter) Card Validator',
    desc: 'Validate and preview twitter:card, twitter:image, and twitter:title tags before posting.',
  },
]

export default function ToolsPage() {
  return (
    <div className="container max-w-3xl space-y-14 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <div>
        <h1 className="text-3xl font-bold">Resources & validation tools</h1>
        <p className="mt-2 text-muted-foreground">
          Built into {siteConfig.name} and a few vetted third-party debuggers for Open Graph meta tags.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">OGKit tools</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((i) => (
            <Link key={i.href} href={withBasePath(i.href)}>
              <Card className="h-full transition-colors hover:bg-muted/40">
                <CardHeader>
                  <CardTitle>{i.title}</CardTitle>
                  <CardDescription>{i.desc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <span className="text-sm font-medium text-primary">Open →</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">How to validate Open Graph images</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Social networks cache <code className="font-mono text-foreground">og:image</code> aggressively. The typical
          workflow is: build your OGKit image URL, preview it in the{' '}
          <Link className="text-primary underline" href={withBasePath('/playground')}>
            Playground
          </Link>{' '}
          to confirm the card layout, then paste your page URL into opengraph.xyz or the Facebook Sharing Debugger to
          see exactly what Slack, iMessage, Twitter, LinkedIn, and Facebook will display after scraping.
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          After a redesign or content update, use the Facebook Sharing Debugger to force-refresh the cached og:image
          for a specific URL. Twitter and X require their own Card Validator for the same purpose. LinkedIn has a{' '}
          <a
            href="https://www.linkedin.com/post-inspector/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline"
          >
            Post Inspector
          </a>{' '}
          that does the same. The OGKit API returns deterministic URLs, so CDNs and scrapers automatically serve the
          cached byte-identical PNG on every subsequent unfurl — no re-render cost, no rate-limit surprise.
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          For a deeper walkthrough of metadata best practices, Next.js{' '}
          <code className="font-mono text-foreground">openGraph.images</code> integration, and common og:image
          mistakes, read the{' '}
          <Link className="text-primary underline" href={withBasePath('/blog/open-graph-images-seo-guide')}>
            Open Graph images SEO guide
          </Link>
          .
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Framework & platform guides</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Implementation snippets and pitfalls for the most common stacks:
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['Next.js guide', '/for/nextjs'],
            ['Astro guide', '/for/astro'],
            ['Remix guide', '/for/remix'],
            ['Rails guide', '/for/rails'],
            ['Vercel deployment', '/platform/vercel'],
            ['Netlify deployment', '/platform/netlify'],
            ['Cloudflare deployment', '/platform/cloudflare'],
            ['Self-hosted', '/platform/self-hosted'],
          ].map(([label, href]) => (
            <Link
              key={href}
              href={withBasePath(href)}
              className="rounded-lg border p-3 text-sm font-medium hover:bg-muted/50"
            >
              {label}
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">External validation tools</h2>
        <ul className="space-y-4">
          {external.map((e) => (
            <li key={e.href} className="rounded-lg border p-4">
              <a href={e.href} target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline">
                {e.label}
              </a>
              <p className="mt-1 text-sm text-muted-foreground">{e.desc}</p>
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground">
          Third-party services are not affiliated with {siteConfig.name}. Use them to verify{' '}
          <code className="font-mono">og:*</code> and Twitter tags after you deploy.
        </p>
        <Button asChild variant="outline" size="sm">
          <Link href={withBasePath('/login')}>Sign in for API keys</Link>
        </Button>
      </section>
    </div>
  )
}
