import Link from 'next/link'
import { absoluteSiteUrl, withBasePath } from '@/config/paths'
import { siteConfig } from '@/config/site'
import { marketingMetadata } from '@/lib/marketing-metadata'
import { breadcrumbListJsonLd } from '@/lib/breadcrumbs'
import { FinishCta } from '@/components/marketing/finish-cta'

export const metadata = marketingMetadata({
  title: 'OGKit blog — Open Graph image API guides, SEO & patterns',
  description:
    'Long-form OGKit writing: Open Graph image SEO, Next.js metadata, signed URLs, framework integrations, and operational patterns for 1200×630 social preview cards.',
  pathname: '/blog',
})

type Post = {
  slug: string
  title: string
  summary: string
  tag: string
  readMinutes: number
  updated: string
}

const posts: Post[] = [
  {
    slug: 'open-graph-images-seo-guide',
    title: 'Dynamic Open Graph images for SEO and social distribution',
    summary:
      'A long-form reference for engineering and growth teams: Open Graph metadata, 1200×630 image sizing, Next.js App Router integration, signed URLs, caching, validation, and common mistakes.',
    tag: 'SEO guide',
    readMinutes: 9,
    updated: 'April 2026',
  },
]

export default function BlogIndexPage() {
  const breadcrumbLd = breadcrumbListJsonLd([{ name: 'Blog', path: '/blog' }])
  const blogJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: `${siteConfig.name} blog`,
    url: absoluteSiteUrl('/blog'),
    description:
      'Long-form Open Graph image API writing: SEO, Next.js metadata, signed URLs, and framework integrations.',
    publisher: { '@type': 'Organization', name: siteConfig.name, url: absoluteSiteUrl('') },
    blogPost: posts.map((p) => ({
      '@type': 'BlogPosting',
      headline: p.title,
      url: absoluteSiteUrl(`/blog/${p.slug}`),
      description: p.summary,
      datePublished: '2026-04-30',
      dateModified: '2026-04-30',
      author: { '@type': 'Organization', name: siteConfig.name },
    })),
  }

  return (
    <div className="container max-w-3xl space-y-12 py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }} />

      <section>
        <p className="text-sm font-medium text-muted-foreground">Blog</p>
        <h1 className="mt-1 text-4xl font-bold tracking-tight">Open Graph image API writing</h1>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
          Long-form guides on Open Graph images, Twitter/X cards, Next.js metadata, signed URLs, caching, and operational
          patterns for social preview images at scale. Each post mirrors the{' '}
          <Link className="text-primary underline" href={withBasePath('/docs')}>
            HTTP API reference
          </Link>{' '}
          and links into the{' '}
          <Link className="text-primary underline" href={withBasePath('/playground')}>
            Playground
          </Link>{' '}
          so product, growth, and engineering teams share the same vocabulary.
        </p>
      </section>

      <section className="space-y-5">
        <h2 className="text-2xl font-semibold">Guides</h2>
        {posts.map((p) => (
          <Link
            key={p.slug}
            href={withBasePath(`/blog/${p.slug}`)}
            className="block rounded-lg border p-6 transition-colors hover:bg-muted/40"
          >
            <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-muted-foreground">
              <span className="rounded-full border bg-muted/40 px-2.5 py-0.5">{p.tag}</span>
              <span>{p.readMinutes} min read</span>
              <span>Updated {p.updated}</span>
            </div>
            <h3 className="mt-3 text-xl font-semibold tracking-tight">{p.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.summary}</p>
            <span className="mt-3 inline-block text-sm font-medium text-primary">Read the guide →</span>
          </Link>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border p-5">
          <h2 className="text-lg font-semibold">Framework guides</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Short, pattern-focused pages for{' '}
            <Link className="text-primary underline" href={withBasePath('/for/nextjs')}>
              Next.js
            </Link>
            ,{' '}
            <Link className="text-primary underline" href={withBasePath('/for/astro')}>
              Astro
            </Link>
            ,{' '}
            <Link className="text-primary underline" href={withBasePath('/for/remix')}>
              Remix
            </Link>
            , and other frameworks.
          </p>
        </div>
        <div className="rounded-lg border p-5">
          <h2 className="text-lg font-semibold">Comparisons</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Decision pages:{' '}
            <Link className="text-primary underline" href={withBasePath('/compare/ogkit-vs-vercel-og')}>
              OGKit vs @vercel/og
            </Link>
            ,{' '}
            <Link className="text-primary underline" href={withBasePath('/compare/satori-vs-puppeteer')}>
              Satori vs Puppeteer
            </Link>
            , and more.
          </p>
        </div>
        <div className="rounded-lg border p-5">
          <h2 className="text-lg font-semibold">Use cases</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Narrative pages on{' '}
            <Link className="text-primary underline" href={withBasePath('/use-case/dynamic-social-preview-images')}>
              dynamic social previews
            </Link>
            ,{' '}
            <Link className="text-primary underline" href={withBasePath('/use-case/changelog')}>
              changelog cards
            </Link>
            , and more.
          </p>
        </div>
      </section>

      <FinishCta />
    </div>
  )
}
