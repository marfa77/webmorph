const canonicalUrl = 'https://webmorp.art'

export const siteConfig = {
  name: 'OGKit',
  /** Main site hostname (for display / links) */
  domain: process.env.NEXT_PUBLIC_SITE_HOST || 'webmorp.art',
  /** Full public URL of this Next app, no trailing slash. */
  url: canonicalUrl,
  tagline: 'Crypto-native Open Graph image API for AI-built sites',
  description:
    'Generate dynamic Open Graph images and social preview cards from one URL. Built for AI-assisted developers, Next.js, SaaS landing pages, blogs, docs, and product launches.',
  author: 'OGKit',
  supportEmail: 'support@webmorph.art',
  twitter: '@ogkitdev',
  /** Source for webmorp.art deploy — [marfa77/webmorph](https://github.com/marfa77/webmorph) */
  github: 'https://github.com/marfa77/webmorph',
}
