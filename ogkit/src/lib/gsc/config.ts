import { absoluteSiteUrl } from '@/config/paths'
import { siteConfig } from '@/config/site'

const GSC_SCOPE = 'https://www.googleapis.com/auth/webmasters'

export type GscServiceAccount = {
  client_email: string
  private_key: string
}

export function gscScope(): string {
  return GSC_SCOPE
}

function parseServiceAccountJson(raw: string | undefined): GscServiceAccount | null {
  const trimmed = raw?.trim()
  if (!trimmed) return null
  try {
    const parsed = JSON.parse(trimmed) as Partial<GscServiceAccount>
    if (!parsed.client_email || !parsed.private_key) return null
    return { client_email: parsed.client_email, private_key: parsed.private_key }
  } catch {
    return null
  }
}

/** Prefer explicit GSC key; fall back to legacy Vercel `GOOGLE_APPLICATION_CREDENTIALS`. */
export function parseGscServiceAccount(): GscServiceAccount | null {
  return (
    parseServiceAccountJson(process.env.GSC_SERVICE_ACCOUNT_JSON) ??
    parseServiceAccountJson(process.env.GOOGLE_APPLICATION_CREDENTIALS)
  )
}

/** GSC property URL — URL prefix (`https://www.webmorp.art/`) or domain (`sc-domain:webmorp.art`). */
export function getGscSiteUrl(): string {
  const fromEnv = process.env.GSC_SITE_URL?.trim()
  if (fromEnv) {
    if (fromEnv.startsWith('sc-domain:')) return fromEnv
    return fromEnv.endsWith('/') ? fromEnv : `${fromEnv}/`
  }
  return `${siteConfig.url.replace(/\/$/, '')}/`
}

export function getGscSitemapUrl(): string {
  const custom = process.env.GSC_SITEMAP_URL?.trim()
  if (custom) return custom
  return absoluteSiteUrl('/sitemap.xml')
}

export function isGscConfigured(): boolean {
  return parseGscServiceAccount() !== null
}

export function gscNotConfiguredBody() {
  return {
    error: 'gsc_not_configured' as const,
    message:
      'Set GSC_SERVICE_ACCOUNT_JSON or GOOGLE_APPLICATION_CREDENTIALS (service account key JSON) and add the service account email as Owner in Google Search Console.',
  }
}
