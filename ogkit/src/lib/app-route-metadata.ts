import type { Metadata } from 'next'
import { absoluteSiteUrl } from '@/config/paths'
import { siteConfig } from '@/config/site'
import { clipMetaDescription } from '@/lib/seo-meta'

const defaultOgImage = `${siteConfig.url}/og-image.jpg`

/**
 * Authenticated or low-value app routes: correct `<title>`, no duplicate `| OGKit`,
 * full social tags, and `noindex` so crawlers do not treat them as thin duplicates.
 */
export function privateAppMetadata(opts: { title: string; description: string; pathname: string }): Metadata {
  const path = opts.pathname.startsWith('/') ? opts.pathname : `/${opts.pathname}`
  const canonical = absoluteSiteUrl(path)
  const description = clipMetaDescription(opts.description)
  return {
    title: { absolute: opts.title },
    description,
    robots: { index: false, follow: true, googleBot: { index: false, follow: true } },
    alternates: { canonical },
    openGraph: {
      title: opts.title,
      description,
      url: canonical,
      type: 'website',
      siteName: siteConfig.name,
      images: [{ url: defaultOgImage, width: 1200, height: 630, alt: `${siteConfig.name} — ${opts.title}` }],
    },
    twitter: {
      card: 'summary_large_image',
      title: opts.title,
      description,
      images: [defaultOgImage],
    },
  }
}
