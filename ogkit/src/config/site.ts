/** Must match the primary host Google indexes (avoid apex vs www duplicate cluster). */
const canonicalUrl = 'https://www.webmorp.art'

export const siteConfig = {
  name: 'OGKit',
  /** Main site hostname (for display / links) */
  domain: process.env.NEXT_PUBLIC_SITE_HOST || 'www.webmorp.art',
  /** Full public URL of this Next app, no trailing slash. */
  url: canonicalUrl,
  tagline: 'Crypto-native Open Graph image API for AI-built sites',
  /** ~120–155 chars: SERP + default `layout` / Open Graph description (avoid truncation noise). */
  description:
    'Open Graph image API: 1200×630 PNG social cards from one HTTPS URL — templates, signed URLs, crypto checkout. Next.js, SaaS, blogs, docs & changelogs.',
  author: 'OGKit',
  /** Source for webmorp.art deploy — [marfa77/webmorph](https://github.com/marfa77/webmorph) */
  github: 'https://github.com/marfa77/webmorph',
}
