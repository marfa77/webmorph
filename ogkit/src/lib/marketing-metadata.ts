import type { Metadata } from 'next'
import { absoluteSiteUrl } from '@/config/paths'
import { siteConfig } from '@/config/site'
import { clipMetaDescription } from '@/lib/seo-meta'

const defaultOgImage = `${siteConfig.url}/og-image.jpg`

/** Consistent SEO metadata for public marketing pages (Google + social previews). */
export function marketingMetadata(opts: { title: string; description: string; pathname: string }): Metadata {
  const path = opts.pathname.startsWith('/') ? opts.pathname : `/${opts.pathname}`
  const canonical = absoluteSiteUrl(path)
  const description = clipMetaDescription(opts.description)
  return {
    /** Full `<title>`; `absolute` avoids duplicating the site name from the root layout template. */
    title: { absolute: opts.title },
    description,
    alternates: { canonical },
    robots: { index: true, follow: true },
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
