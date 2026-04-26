import Link from 'next/link'
import { withBasePath } from '@/config/paths'
import { siteConfig } from '@/config/site'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: siteConfig.name,
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Web',
    url: siteConfig.url,
    description: siteConfig.description,
    offers: [
      { '@type': 'Offer', name: 'Free', price: '0', priceCurrency: 'USD' },
      { '@type': 'Offer', name: 'Pro', price: '19', priceCurrency: 'USD' },
      { '@type': 'Offer', name: 'Scale', price: '99', priceCurrency: 'USD' },
    ],
  }

  return (
    <div className="container max-w-5xl py-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="max-w-4xl">
        <p className="text-sm font-medium text-muted-foreground">{siteConfig.tagline}</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-6xl">
          Dynamic Open Graph images from one API URL
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          {siteConfig.description} Use OGKit as a hosted alternative to custom Vercel OG routes, screenshot services, and
          hand-designed social cards.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Button asChild>
            <Link href={withBasePath('/playground')}>Try the OG image playground</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={withBasePath('/docs')}>Read the API docs</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={withBasePath('/pricing')}>View pricing</Link>
          </Button>
        </div>
      </div>

      <section className="mt-16 grid gap-4 md:grid-cols-3">
        {[
          ['For developers', 'Generate 1200x630 PNG cards for Next.js, React, Remix, Astro, Rails, Django, and any stack that can build a URL.'],
          ['For launch pages', 'Create branded social previews for SaaS landing pages, product launches, changelogs, blogs, and documentation.'],
          ['For production', 'API keys, monthly quota, cache-friendly responses, watermark-free paid plans, and a Playground for testing every template.'],
        ].map(([title, copy]) => (
          <div key={title} className="rounded-lg border bg-card p-5">
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{copy}</p>
          </div>
        ))}
      </section>

      <section className="mt-16 space-y-4">
        <h2 className="text-2xl font-bold">Open Graph image API use cases</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ['Next.js OG images', '/for/nextjs'],
            ['Blog post social cards', '/use-case/blog'],
            ['Changelog previews', '/use-case/changelog'],
            ['Product launch images', '/use-case/product-launch'],
            ['Vercel deployment', '/platform/vercel'],
            ['API documentation', '/docs'],
          ].map(([label, href]) => (
            <Link key={href} href={withBasePath(href)} className="rounded-md border p-4 text-sm font-medium hover:bg-muted/50">
              {label}
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-16 rounded-lg border bg-muted/30 p-6">
        <h2 className="text-2xl font-bold">Frequently asked questions</h2>
        <div className="mt-4 grid gap-5 md:grid-cols-2">
          <div>
            <h3 className="font-semibold">What is OGKit?</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              OGKit is a hosted API that returns dynamic Open Graph images as PNG files from template and query parameters.
            </p>
          </div>
          <div>
            <h3 className="font-semibold">Does it work with Next.js?</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Yes. Point `metadata.openGraph.images` at an OGKit URL or generate the URL server-side in your app.
            </p>
          </div>
          <div>
            <h3 className="font-semibold">Is there a free plan?</h3>
            <p className="mt-1 text-sm text-muted-foreground">Yes. Free includes 100 images per month with a watermark.</p>
          </div>
          <div>
            <h3 className="font-semibold">Can LLMs understand the API?</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Yes. OGKit exposes docs, examples, sitemap, robots, and `llms.txt` for AI crawlers and answer engines.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
