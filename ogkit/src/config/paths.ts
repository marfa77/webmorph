import { siteConfig } from '@/config/site'

/**
 * Leave empty when OGKit owns the site root. Set only if the app is mounted
 * below another path by the hosting layer.
 */
export const publicBasePath = (process.env.NEXT_PUBLIC_BASE_PATH || '').replace(/\/$/, '')

/** Absolute canonical URL for the primary host + optional `NEXT_PUBLIC_BASE_PATH` (sitemap, metadata, JSON-LD). */
export function absoluteSiteUrl(pathname: string) {
  const base = siteConfig.url.replace(/\/$/, '')
  const normalized =
    pathname === '' || pathname === '/' ? '' : pathname.startsWith('/') ? pathname : `/${pathname}`
  return `${base}${publicBasePath}${normalized}`
}

/** e.g. "/ogkit/pricing" or "/pricing" if no base */
export function withBasePath(href: string) {
  const p = href.startsWith('/') ? href : `/${href}`
  if (!publicBasePath) return p
  return `${publicBasePath}${p}`
}

/** Public URL of the app, no trailing slash. Prefer NEXT_PUBLIC_APP_URL on the server. */
export function getAppBaseUrl() {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL
  if (fromEnv) return fromEnv.replace(/\/$/, '')
  if (typeof window !== 'undefined') {
    return `${window.location.origin}${publicBasePath}`.replace(/\/$/, '')
  }
  return 'https://www.webmorp.art'
}

export function getApiUrl(path: string) {
  const p = path.startsWith('/') ? path : `/${path}`
  if (!publicBasePath) return p
  return `${publicBasePath}${p}`
}
