const publicUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL

export const siteConfig = {
  name: 'OGKit',
  /** Main site hostname (for display / links) */
  domain: process.env.NEXT_PUBLIC_SITE_HOST || 'www.webmorp.art',
  /** Full public URL of this Next app, no trailing slash. */
  url: publicUrl || 'https://webmorp.art',
  tagline: 'OG image API for every framework',
  description:
    'Generate dynamic Open Graph images for any framework. One URL, any language. Pro from $19/mo.',
  author: 'OGKit',
  supportEmail: 'support@ogkit.dev',
  twitter: '@ogkitdev',
  /** Source for webmorp.art deploy — [marfa77/webmorph](https://github.com/marfa77/webmorph) */
  github: 'https://github.com/marfa77/webmorph',
}
