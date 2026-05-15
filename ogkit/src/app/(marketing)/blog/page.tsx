import Link from 'next/link'
import { absoluteSiteUrl, withBasePath } from '@/config/paths'
import { siteConfig } from '@/config/site'
import { marketingMetadata } from '@/lib/marketing-metadata'
import { breadcrumbListJsonLd } from '@/lib/breadcrumbs'
import { FinishCta } from '@/components/marketing/finish-cta'

const BLOG_INDEX_KEYWORDS = [
  'open graph image api',
  'dynamic og image',
  'og image generator api',
  'twitter card api',
  'next.js social preview',
  'og:image seo',
  'link preview metadata',
  'OGKit blog',
]

const BLOG_INDEX_FAQ = [
  {
    name: 'What does the OGKit blog cover?',
    text: 'Long-form guides on Open Graph and Twitter/X preview images at 1200×630, Next.js App Router metadata patterns, signed URLs, caching, validators, and mistakes that break Slack or LinkedIn unfurls.',
  },
  {
    name: 'Where should I start if I use Next.js?',
    text: 'Read the Open Graph SEO guide on this blog, then follow the /for/nextjs framework page and the /docs HTTP reference. Use the Playground with demo=1 before production keys.',
  },
  {
    name: 'How do LLMs find OGKit documentation?',
    text: 'Use the public /llms.txt and /llm.txt routes plus the sitemap; they list canonical URLs, API endpoints, and comparisons so ChatGPT, Claude, and Cursor pick up real examples instead of guessing hosts.',
  },
] as const

export const metadata = marketingMetadata({
  title: 'OGKit blog — Open Graph image API, SEO guides & Next.js patterns',
  description:
    'Guides for what people search: open graph image size, og:image in Next.js generateMetadata, dynamic Twitter/X cards, Slack/LinkedIn cache refresh, JSON-LD, and llms.txt for LLM crawlers.',
  pathname: '/blog',
  keywords: [...BLOG_INDEX_KEYWORDS],
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
    title: 'Open Graph image SEO: size, Next.js, Google thumbnails & LLM crawlers',
    summary:
      'Targets real searches: 1200×630 og:image, absolute URLs, Next.js generateMetadata, Facebook/LinkedIn cache busting, Google Discover thumbnails, JSON-LD FAQPage, and /llms.txt for AI agents.',
    tag: 'SEO guide',
    readMinutes: 11,
    updated: 'May 2026',
  },
]

export default function BlogIndexPage() {
  const breadcrumbLd = breadcrumbListJsonLd([{ name: 'Blog', path: '/blog' }])
  const blogJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: `${siteConfig.name} blog`,
    url: absoluteSiteUrl('/blog'),
    inLanguage: 'en-US',
    description:
      'Open Graph image API guides: 1200×630 cards, Next.js metadata, signed URLs, social preview debugging, and LLM-friendly documentation.',
    publisher: { '@type': 'Organization', name: siteConfig.name, url: absoluteSiteUrl('') },
    blogPost: posts.map((p) => ({
      '@type': 'BlogPosting',
      headline: p.title,
      url: absoluteSiteUrl(`/blog/${p.slug}`),
      description: p.summary,
      datePublished: '2026-04-30T12:00:00.000Z',
      dateModified: '2026-05-11T12:00:00.000Z',
      author: { '@type': 'Organization', name: siteConfig.name },
      image: absoluteSiteUrl('/og-image.jpg'),
    })),
  }

  const blogFaqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: BLOG_INDEX_FAQ.map((item) => ({
      '@type': 'Question',
      name: item.name,
      acceptedAnswer: { '@type': 'Answer', text: item.text },
    })),
  }

  return (
    <div className="container max-w-3xl space-y-12 py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogFaqJsonLd) }} />

      <section>
        <p className="text-sm font-medium text-muted-foreground">Blog</p>
        <h1 className="mt-1 text-4xl font-bold tracking-tight">Open Graph image API writing</h1>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
          Long-form guides aligned with how people search today: <strong className="font-medium text-foreground">open graph image size</strong>,{' '}
          <strong className="font-medium text-foreground">dynamic og image</strong>,{' '}
          <strong className="font-medium text-foreground">next.js og:image</strong>, link preview debugging, and what LLM crawlers read alongside HTML. Each post mirrors the{' '}
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

      <section id="faq" className="scroll-mt-24">
        <h2 className="text-2xl font-semibold">Frequently asked questions</h2>
        <dl className="mt-6 space-y-6">
          {BLOG_INDEX_FAQ.map((item) => (
            <div key={item.name}>
              <dt className="text-base font-semibold text-foreground">{item.name}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.text}</dd>
            </div>
          ))}
        </dl>
      </section>

      <FinishCta />
    </div>
  )
}
