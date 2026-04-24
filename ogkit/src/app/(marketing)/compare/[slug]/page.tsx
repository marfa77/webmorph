import { siteConfig } from '@/config/site'
import { notFound } from 'next/navigation'
import { FinishCta } from '@/components/marketing/finish-cta'

const COPY: Record<string, { h1: string; body: string }> = {
  'ogkit-vs-bannerbear': {
    h1: 'OGKit vs Bannerbear',
    body: 'OGKit is API-first: one URL per image, no design canvas. You pass title, image URLs, and template slugs. Bannerbear focuses on a template builder and image generation workflows. Pick OGKit if you only need share cards from your backend or meta tags with predictable URLs.',
  },
  'ogkit-vs-placid': {
    h1: 'OGKit vs Placid',
    body: 'Placid is strong for no-code layout workflows. OGKit is built for developers who want Open Graph (1200×630) images from a single request URL with strict query parameters and a small set of templates. Both can sit behind a CDN; OGKit keeps the contract minimal.',
  },
  'satori-vs-puppeteer': {
    h1: 'Satori vs Puppeteer (and OGKit)',
    body: 'Satori is the React-to-SVG/PNG engine many OG services use, including this app. Puppeteer drives a headless browser—powerful but heavier. OGKit uses a fixed template + Satori under the hood so you do not run Chrome on your billable path.',
  },
}

const ALLOWED = new Set(Object.keys(COPY))
type Props = { params: { slug: string } }

export function generateMetadata({ params }: Props) {
  if (!ALLOWED.has(params.slug)) return {}
  return { title: `Compare: ${params.slug} — ${siteConfig.name}` }
}

export default function ComparePage({ params }: Props) {
  if (!ALLOWED.has(params.slug)) notFound()
  const c = COPY[params.slug]!
  return (
    <div className="container max-w-3xl py-12">
      <h1 className="text-3xl font-bold">{c.h1}</h1>
      <p className="mt-4 text-muted-foreground leading-relaxed">{c.body}</p>
      <FinishCta />
    </div>
  )
}
