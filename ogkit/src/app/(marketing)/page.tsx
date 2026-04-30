import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { absoluteSiteUrl, withBasePath } from '@/config/paths'
import { siteConfig } from '@/config/site'
import { breadcrumbListJsonLd } from '@/lib/breadcrumbs'
import { clipMetaDescription } from '@/lib/seo-meta'
import { Button } from '@/components/ui/button'

const homeCanonical = absoluteSiteUrl('')
/** ~54 chars: avoids root `title.template` appending `| OGKit` twice in SERP. */
const homeTitle = `${siteConfig.name} — Open Graph image API for 1200×630 social cards`
const homeDescription = clipMetaDescription(siteConfig.description)
export const metadata: Metadata = {
  title: { absolute: homeTitle },
  description: homeDescription,
  alternates: { canonical: homeCanonical },
  openGraph: {
    type: 'website',
    url: homeCanonical,
    siteName: siteConfig.name,
    title: homeTitle,
    description: homeDescription,
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'OGKit dynamic Open Graph image API' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: homeTitle,
    description: homeDescription,
    images: ['/og-image.jpg'],
  },
}

export default function HomePage() {
  const faq = [
    {
      question: 'What is OGKit?',
      answer:
        'OGKit is a crypto-native Open Graph image API that returns dynamic 1200x630 PNG social preview images from template and query parameters.',
    },
    {
      question: 'Why crypto-only checkout?',
      answer:
        'Crypto checkout keeps OGKit available to global developers without card processors, regional billing blocks, or subscription lock-in.',
    },
    {
      question: 'Is OGKit a Vercel OG alternative?',
      answer:
        'Yes. OGKit is a Vercel OG alternative for teams that want hosted templates, API keys, quotas, and a Playground instead of maintaining custom @vercel/og routes.',
    },
    {
      question: 'Does OGKit work with Next.js?',
      answer:
        'Yes. In Next.js App Router, point metadata.openGraph.images and twitter.images at a full OGKit image URL generated on the server.',
    },
    {
      question: 'How is OGKit different from screenshot APIs?',
      answer:
        'Screenshot APIs capture webpages. OGKit generates purpose-built Open Graph cards from structured fields like title, author, image, logo, and product details.',
    },
  ]

  const siteRoot = absoluteSiteUrl('')
  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.name,
    url: siteRoot,
    description: siteConfig.description,
    publisher: { '@type': 'Organization', name: siteConfig.name, url: siteRoot, sameAs: siteConfig.github },
  }
  const softwareJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: siteConfig.name,
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Web',
    url: siteRoot,
    description: siteConfig.description,
    offers: [
      { '@type': 'Offer', name: 'Free', price: '0', priceCurrency: 'USD', url: absoluteSiteUrl('/pricing') },
      { '@type': 'Offer', name: 'Pro', price: '19', priceCurrency: 'USD', url: absoluteSiteUrl('/pricing') },
      { '@type': 'Offer', name: 'Scale', price: '99', priceCurrency: 'USD', url: absoluteSiteUrl('/pricing') },
    ],
  }
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }
  const breadcrumbLd = breadcrumbListJsonLd([])

  return (
    <div className="container max-w-5xl py-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <div className="grid items-center gap-10 lg:grid-cols-[0.95fr_1.05fr]">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{siteConfig.tagline}</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-6xl">
            Open Graph image API for 1200×630 social cards
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            {siteConfig.name} turns one HTTPS URL into a 1200×630 PNG{' '}
            <code className="font-mono text-foreground">og:image</code> for any framework. Generate dynamic social preview
            cards for Slack, Discord, LinkedIn, iMessage, and X from server-rendered metadata — no custom renderer, no
            Satori bundle budget, no headless browser. Use OGKit as a hosted alternative to Vercel OG routes, screenshot
            services, and hand-designed cards; pay globally with crypto when you need production quota.
          </p>
          <div className="mt-5 flex flex-wrap gap-2 text-xs font-medium text-muted-foreground">
            {['No-login demo previews', 'Crypto-native checkout', 'Cursor-friendly docs', 'Signed production URLs'].map((item) => (
              <span key={item} className="rounded-full border bg-muted/40 px-3 py-1">
                {item}
              </span>
            ))}
          </div>
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
        <div className="relative">
          <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-sky-500/20 via-indigo-500/10 to-transparent blur-2xl" />
          <div className="relative rounded-[1.75rem] border bg-background/80 p-3 shadow-2xl shadow-slate-950/10">
            <Image
              src="/previews/article-preview.png"
              width={1200}
              height={630}
              alt="Example OGKit article Open Graph image preview"
              priority
              sizes="(min-width: 1024px) 600px, (min-width: 640px) 90vw, 100vw"
              className="rounded-[1.25rem]"
            />
          </div>
        </div>
      </div>

      <section className="mt-16">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-2xl font-bold">Preview templates that look ready to ship</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              OGKit generates real 1200x630 social cards for articles, products, launch pages, and developer docs.
            </p>
          </div>
          <Link href={withBasePath('/playground')} className="text-sm font-medium underline">
            Open Playground
          </Link>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            ['Article template', '/previews/article-preview.png', 'Article social preview image generated by OGKit'],
            ['Product template', '/previews/product-preview.png', 'Product social preview image generated by OGKit'],
            ['Code template', '/previews/code-preview.png', 'Developer code social preview image generated by OGKit'],
          ].map(([label, src, alt]) => (
            <figure key={src} className="overflow-hidden rounded-xl border bg-card">
              <Image
                src={src}
                width={1200}
                height={630}
                alt={alt}
                loading="lazy"
                sizes="(min-width: 1024px) 350px, (min-width: 640px) 45vw, 100vw"
                className="aspect-[1200/630] object-cover"
              />
              <figcaption className="border-t px-4 py-3 text-sm font-medium">{label}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="mt-16 grid gap-4 md:grid-cols-3">
        {[
          ['For AI-assisted developers', 'Paste the docs into Cursor or Claude and build deterministic 1200x630 PNG URLs for Next.js, Astro, Rails, Django, and any stack.'],
          ['For global indie teams', 'Start with watermarked demo previews, then upgrade through crypto checkout when you need production quota and no watermark.'],
          ['For production', 'API keys, monthly quota, cache-friendly responses, signed URLs, domain allowlists, and a Playground for testing every template.'],
        ].map(([title, copy]) => (
          <div key={title} className="rounded-lg border bg-card p-5">
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{copy}</p>
          </div>
        ))}
      </section>

      <section className="mt-16 space-y-4">
        <h2 className="text-2xl font-bold">How the Open Graph image API works</h2>
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
          Every OGKit template is an HTTPS endpoint. You pass structured fields — title, subtitle, author, logo, product
          image, price, or code snippet — as URL query parameters, and the API returns a ready-to-embed 1200×630 PNG.
          There is nothing to install: build the URL on the server, assign it to{' '}
          <code className="font-mono text-foreground">openGraph.images</code> (Next.js), a{' '}
          <code className="font-mono text-foreground">&lt;meta property=&quot;og:image&quot;&gt;</code> tag, or any
          framework metadata layer, and you are done.
        </p>
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
          Because image URLs are deterministic, CDNs and social-network scrapers cache the PNG after the first fetch.
          Slack, LinkedIn, iMessage, Discord, and X unfurl the same cached byte-for-byte preview on every reshare — no
          re-render, no rate-limit surprise. Watermarked{' '}
          <code className="font-mono text-foreground">demo=1</code> previews are available without an account, so you
          can validate your card layout in the{' '}
          <Link className="text-primary underline" href={withBasePath('/playground')}>
            Playground
          </Link>{' '}
          before committing to a production key. Read the{' '}
          <Link className="text-primary underline" href={withBasePath('/blog/open-graph-images-seo-guide')}>
            Open Graph SEO guide
          </Link>{' '}
          for a deeper walkthrough of metadata patterns, caching, and common mistakes.
        </p>
      </section>

      <section className="mt-16 space-y-4">
        <h2 className="text-2xl font-bold">Built for crypto-native developer workflows</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ['Try first', 'Generate watermarked demo images without creating an account or entering a card.'],
            ['Pay globally', 'Crypto checkout avoids card processor limits and keeps paid access simple for international builders.'],
            ['Ship safely', 'Use signed URLs and domain allowlists when public pages need controlled image generation.'],
          ].map(([title, copy]) => (
            <div key={title} className="rounded-lg border bg-card p-5">
              <h3 className="font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16 space-y-4">
        <h2 className="text-2xl font-bold">Open Graph image API use cases</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ['Next.js OG images', '/for/nextjs'],
            ['Dynamic social preview images', '/use-case/dynamic-social-preview-images'],
            ['Blog post social cards', '/use-case/blog'],
            ['Changelog previews', '/use-case/changelog'],
            ['Product launch images', '/use-case/product-launch'],
            ['Vercel deployment', '/platform/vercel'],
            ['API documentation', '/docs'],
            ['Open Graph SEO guide', '/blog/open-graph-images-seo-guide'],
          ].map(([label, href]) => (
            <Link key={href} href={withBasePath(href)} className="rounded-md border p-4 text-sm font-medium hover:bg-muted/50">
              {label}
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-16 space-y-4">
        <h2 className="text-2xl font-bold">Compare OGKit</h2>
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
          Short decision pages for teams evaluating OGKit against custom Vercel OG routes, MetaShot, OGMagic,
          Bannerbear-style template tools, and browser screenshot APIs.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ['OGKit vs Vercel OG', '/compare/ogkit-vs-vercel-og'],
            ['OGKit vs MetaShot', '/compare/ogkit-vs-metashot'],
            ['OGKit vs OGMagic', '/compare/ogkit-vs-ogmagic'],
            ['OGKit vs Bannerbear', '/compare/ogkit-vs-bannerbear'],
            ['OGKit vs Placid', '/compare/ogkit-vs-placid'],
            ['OGKit vs screenshot APIs', '/compare/ogkit-vs-screenshot-apis'],
            ['Satori vs Puppeteer', '/compare/satori-vs-puppeteer'],
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
          {faq.map((item) => (
            <div key={item.question}>
              <h3 className="font-semibold">{item.question}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{item.answer}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
