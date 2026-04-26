const publicUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL
const canonicalUrl =
  publicUrl && !publicUrl.includes('localhost') && !publicUrl.includes('127.0.0.1')
    ? publicUrl.replace(/\/$/, '')
    : 'https://webmorp.art'

export const siteConfig = {
  name: 'OGKit',
  /** Main site hostname (for display / links) */
  domain: process.env.NEXT_PUBLIC_SITE_HOST || 'webmorp.art',
  /** Full public URL of this Next app, no trailing slash. */
  url: canonicalUrl,
  tagline: 'Open Graph image API for every framework',
  description:
    'Generate dynamic Open Graph images and social preview cards from one URL. Built for Next.js, SaaS landing pages, blogs, docs, and product launches.',
  author: 'OGKit',
  supportEmail: 'support@ogkit.dev',
  twitter: '@ogkitdev',
  /** Source for webmorp.art deploy — [marfa77/webmorph](https://github.com/marfa77/webmorph) */
  github: 'https://github.com/marfa77/webmorph',
}
