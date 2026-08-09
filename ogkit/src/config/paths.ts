import { siteConfig } from '@/config/site'

/**
 * Set NEXT_PUBLIC_BASE_PATH=/ogkit in production so OGKit lives at /ogkit
 * and static website landings can own the site root (/).
 */
export const publicBasePath = (process.env.NEXT_PUBLIC_BASE_PATH || '').replace(/\/$/, '')

function normalizePath(href: string) {
  if (!href) return '/'
  return href.startsWith('/') ? href : `/${href}`
}

/** Absolute canonical URL for the primary host + optional `NEXT_PUBLIC_BASE_PATH` (sitemap, metadata, JSON-LD). */
export function absoluteSiteUrl(pathname: string) {
  const base = siteConfig.url.replace(/\/$/, '')
  const normalized =
    pathname === '' || pathname === '/' ? '' : pathname.startsWith('/') ? pathname : `/${pathname}`
  return `${base}${publicBasePath}${normalized}`
}

/**
 * App-relative path for Next.js `<Link>`, `router.push`, and `redirect()`.
 * Next already prefixes `basePath` — do **not** add `/ogkit` again here
 * (that produced `/ogkit/ogkit/pricing` in nav).
 */
export function withBasePath(href: string) {
  const p = normalizePath(href)
  // Tolerate callers that already included the public base path.
  if (publicBasePath && (p === publicBasePath || p.startsWith(`${publicBasePath}/`))) {
    return p.slice(publicBasePath.length) || '/'
  }
  return p
}

/**
 * Full public pathname including `NEXT_PUBLIC_BASE_PATH`.
 * Use for raw `<a href>`, `fetch`, middleware/`new URL(...)` redirects, Auth page URLs.
 */
export function publicPath(href: string) {
  const p = withBasePath(href)
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
  return publicPath(path)
}
