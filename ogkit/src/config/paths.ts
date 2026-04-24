/**
 * Set NEXT_PUBLIC_BASE_PATH=/ogkit when the app is served at https://www.webmorp.art/ogkit
 * (leave empty for local: http://localhost:3000).
 */
export const publicBasePath = (process.env.NEXT_PUBLIC_BASE_PATH || '').replace(/\/$/, '')

/** e.g. "/ogkit/pricing" or "/pricing" if no base */
export function withBasePath(href: string) {
  const p = href.startsWith('/') ? href : `/${href}`
  if (!publicBasePath) return p
  return `${publicBasePath}${p}`
}

/** Public URL of the app, no trailing slash. Prefer NEXT_PUBLIC_APP_URL. */
export function getAppBaseUrl() {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL
  if (fromEnv) return fromEnv.replace(/\/$/, '')
  if (typeof window !== 'undefined') {
    return `${window.location.origin}${publicBasePath}`.replace(/\/$/, '')
  }
  return 'http://localhost:3000'
}

/**
 * URL Supabase will redirect the magic link to. Must be listed in Supabase Auth → URL Configuration → Redirect URLs.
 * On localhost we always use the current origin (ignores a mistaken production URL in .env) so `exchangeCodeForSession` runs on the same host that requested the link.
 */
export function getAuthCallbackUrl() {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname
    if (host === 'localhost' || host === '127.0.0.1') {
      return `${window.location.origin.replace(/\/$/, '')}${withBasePath('/callback')}`
    }
  }
  return `${getAppBaseUrl()}/callback`
}

export function getApiUrl(path: string) {
  const p = path.startsWith('/') ? path : `/${path}`
  if (!publicBasePath) return p
  return `${publicBasePath}${p}`
}
