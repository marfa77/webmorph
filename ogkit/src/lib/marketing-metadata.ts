import type { Metadata } from 'next'
import { absoluteSiteUrl } from '@/config/paths'
import { siteConfig } from '@/config/site'
import { clipMetaDescription } from '@/lib/seo-meta'

const defaultOgImage = `${siteConfig.url}/og-image.jpg`

export type MarketingArticleMeta = {
  publishedTime: string
  modifiedTime?: string
  authors?: string[]
}

export type MarketingMetadataInput = {
  title: string
  description: string
  pathname: string
  /** Targeted phrases for Google / LLM retrieval (keep concise, no stuffing). */
  keywords?: string[]
  /** When set, `openGraph.type` is `article` and times are emitted for Discover / rich results. */
  article?: MarketingArticleMeta
  /** Override default marketing OG image (absolute URL). */
  ogImageUrl?: string
}

/** Consistent SEO metadata for public marketing pages (Google + social + LLM crawlers). */
export function marketingMetadata(opts: MarketingMetadataInput): Metadata {
  const path = opts.pathname.startsWith('/') ? opts.pathname : `/${opts.pathname}`
  const canonical = absoluteSiteUrl(path)
  const description = clipMetaDescription(opts.description)
  const ogUrl = opts.ogImageUrl ?? defaultOgImage
  const images: NonNullable<Metadata['openGraph']>['images'] = [
    { url: ogUrl, width: 1200, height: 630, alt: `${siteConfig.name} — ${opts.title}` },
  ]

  const openGraph: Metadata['openGraph'] = {
    title: opts.title,
    description,
    url: canonical,
    siteName: siteConfig.name,
    images,
    ...(opts.article
      ? {
          type: 'article' as const,
          publishedTime: opts.article.publishedTime,
          modifiedTime: opts.article.modifiedTime ?? opts.article.publishedTime,
          authors: (opts.article.authors?.length ? opts.article.authors : [siteConfig.name]).map((name) => name),
        }
      : { type: 'website' as const }),
  }

  return {
    title: { absolute: opts.title },
    description,
    keywords: opts.keywords?.length ? opts.keywords : undefined,
    alternates: { canonical },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
    openGraph,
    twitter: {
      card: 'summary_large_image',
      title: opts.title,
      description,
      images: [ogUrl],
    },
  }
}
