import Link from 'next/link'
import { absoluteSiteUrl, withBasePath } from '@/config/paths'
import { siteConfig } from '@/config/site'
import { notFound } from 'next/navigation'
import { FinishCta } from '@/components/marketing/finish-cta'
import { clipMetaDescription } from '@/lib/seo-meta'

const COPY: Record<string, string> = {
  vercel:
    'Host this Next.js app on Vercel, set your `NEXT_PUBLIC_APP_URL` to the deployment origin, and point `og:image` to the same project’s `/api/og/...` route. Edge and Node runtimes are supported; the OG route runs on Node for key verification.',
  netlify:
    'Deploy the app to Netlify, set public URL env vars, and use the generated OG image URL in your page metadata. Keep your API key server-side or in a serverless function that builds the image URL.',
  cloudflare:
    'If you use Cloudflare in front of the app, cache `GET /api/og/...` at the edge as suitable; the response includes cache headers. Do not expose your key in public HTML—build the URL in your origin when possible.',
  'self-hosted':
    'Run the app behind your own reverse proxy. Expose one public HTTPS host for the API, store `API_KEY_SALT` and Supabase keys in env, and use the same `/api/og/{template}` pattern as in the docs.',
}

const DETAILS: Record<string, { env: string[]; checklist: string[]; cache: string }> = {
  vercel: {
    env: [`NEXT_PUBLIC_APP_URL=${siteConfig.url}`, 'OGKIT_KEY=ogk_live_...', 'API_KEY_SALT=...'],
    checklist: ['Use the final production domain in public URL env vars.', 'Keep API keys server-side.', 'Let Vercel cache generated PNG responses.'],
    cache: 'OGKit image responses include cache headers for CDN reuse. Keep image URLs deterministic so repeated shares hit cache instead of re-rendering.',
  },
  netlify: {
    env: ['NEXT_PUBLIC_APP_URL=https://example.com', 'OGKIT_KEY=ogk_live_...', 'API_KEY_SALT=...'],
    checklist: ['Set the deployed HTTPS origin explicitly.', 'Generate image URLs in server functions or build steps.', 'Avoid exposing API keys in static HTML.'],
    cache: 'Use Netlify edge/CDN behavior for static pages and keep OGKit image URLs stable. Changing query parameters should be the cache-busting mechanism.',
  },
  cloudflare: {
    env: ['NEXT_PUBLIC_APP_URL=https://example.com', 'OGKIT_KEY=ogk_live_...', 'API_KEY_SALT=...'],
    checklist: ['Cache public OG image GET requests at the edge.', 'Bypass cache for dashboard and account pages.', 'Use signed URLs for public generation controls.'],
    cache: 'Cloudflare can cache generated images aggressively because the query string defines the image. Do not cache authenticated dashboard routes.',
  },
  'self-hosted': {
    env: ['NEXT_PUBLIC_APP_URL=https://example.com', 'OGKIT_KEY=ogk_live_...', 'API_KEY_SALT=...'],
    checklist: ['Serve one canonical HTTPS host.', 'Redirect http and www variants in one hop.', 'Put a CDN in front of generated image routes if traffic grows.'],
    cache: 'Self-hosted deployments should preserve OGKit cache headers and avoid proxy rules that strip query strings from image requests.',
  },
}

const ALLOWED = new Set(Object.keys(COPY))
type Props = { params: { platform: string } }

export function generateMetadata({ params }: Props) {
  if (!ALLOWED.has(params.platform)) return {}
  const label = params.platform.replace('-', ' ')
  const title = `Open Graph image API on ${label} — ${siteConfig.name}`
  const description = clipMetaDescription(
    `Deploy the OGKit Open Graph image API on ${label}: canonical HTTPS URLs, env vars, CDN caching for GET /api/og/…, signed URLs, and Google-friendly sitemap/robots patterns. Works as a hosted alternative to custom Next.js image routes.`,
  )
  const image = new URL(`${siteConfig.url}/api/og/minimal`)
  image.searchParams.set('demo', '1')
  image.searchParams.set('title', `OG image API on ${label}`)
  image.searchParams.set('subtitle', 'Deployment guide')
  const canonical = absoluteSiteUrl(`/platform/${params.platform}`)
  return {
    title: { absolute: title },
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, images: [image.toString()] },
    twitter: { card: 'summary_large_image', title, description, images: [image.toString()] },
  }
}

export default function PlatformPage({ params }: Props) {
  if (!ALLOWED.has(params.platform)) notFound()
  const p = params.platform
  const details = DETAILS[p]!
  const label = p.replace('-', ' ')
  const faq = [
    {
      question: `How do I deploy an Open Graph image API on ${label}?`,
      answer: `Deploy OGKit with a final HTTPS public URL, set the required environment variables, and generate image URLs from server-side code or build-time metadata.`,
    },
    {
      question: 'Should sitemap and canonical URLs use the deployment URL or final domain?',
      answer: 'They should use the final canonical HTTPS domain. Preview URLs, http URLs, and www variants can create redirect and indexability issues.',
    },
    {
      question: 'Can I cache generated OG images?',
      answer: 'Yes. OGKit image URLs are deterministic, and generated PNG responses include cache headers. Keep query strings intact when caching.',
    },
  ]
  const canonical = absoluteSiteUrl(`/platform/${p}`)
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: siteConfig.name, item: absoluteSiteUrl('') },
      { '@type': 'ListItem', position: 2, name: `Deploy on ${label}`, item: canonical },
    ],
  }
  const jsonLd = [
    breadcrumbLd,
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faq.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: { '@type': 'Answer', text: item.answer },
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      headline: `Open Graph image API on ${label}`,
      description: COPY[p],
      author: { '@type': 'Organization', name: siteConfig.name },
      publisher: { '@type': 'Organization', name: siteConfig.name, url: absoluteSiteUrl('') },
      mainEntityOfPage: canonical,
    },
  ]
  return (
    <div className="container max-w-4xl space-y-12 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section>
        <p className="text-sm font-medium text-muted-foreground">Deployment guide</p>
        <h1 className="mt-1 text-4xl font-bold tracking-tight capitalize">Open Graph image API on {p.replace('-', ' ')}</h1>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{COPY[p]!}</p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Use this guide when evaluating OGKit as a hosted Vercel OG alternative, screenshot-service alternative, or
          framework-neutral social preview image API. The important SEO rule is that canonical URLs, sitemap URLs, and
          generated image URLs should all use the same final HTTPS host.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border p-5">
          <h2 className="text-xl font-semibold">Environment checklist</h2>
          <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-muted-foreground">
            {details.env.map((item) => (
              <li key={item}>
                <code className="font-mono">{item}</code>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg border p-5">
          <h2 className="text-xl font-semibold">Production checklist</h2>
          <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-muted-foreground">
            {details.checklist.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold">Caching and crawlability</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{details.cache}</p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          For SEO crawlers, avoid bot challenges on public pages, <code className="font-mono">robots.txt</code>, and{' '}
          <code className="font-mono">sitemap.xml</code>. If a crawler sees a challenge page or a redirect chain, it may mark
          otherwise valid pages as non-indexable.
        </p>
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
        <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-muted-foreground">
          <li>
            <Link className="text-primary underline" href={withBasePath('/docs')}>
              API reference
            </Link>{' '}
            — templates, query parameters, and auth.
          </li>
          <li>
            <Link className="text-primary underline" href={withBasePath('/blog/open-graph-images-seo-guide')}>
              Open Graph SEO guide
            </Link>{' '}
            — metadata, caching, and mistakes.
          </li>
          <li>
            <Link className="text-primary underline" href={withBasePath('/for/nextjs')}>
              Next.js framework guide
            </Link>{' '}
            — App Router snippets.
          </li>
        </ul>
      </section>

      <FinishCta />
    </div>
  )
}
