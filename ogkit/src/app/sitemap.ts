import { siteConfig } from '@/config/site'
import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteConfig.url
  return [
    { url: base, lastModified: new Date() },
    { url: `${base}/docs`, lastModified: new Date() },
    { url: `${base}/playground`, lastModified: new Date() },
    { url: `${base}/pricing`, lastModified: new Date() },
    { url: `${base}/tools`, lastModified: new Date() },
  ]
}
