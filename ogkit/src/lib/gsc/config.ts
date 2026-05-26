import { siteConfig } from '@/config/site'

const GSC_SCOPE = 'https://www.googleapis.com/auth/webmasters'

export type GscServiceAccount = {
  client_email: string
  private_key: string
}

export function gscScope(): string {
  return GSC_SCOPE
}

export function parseGscServiceAccount(): GscServiceAccount | null {
  const raw = process.env.GSC_SERVICE_ACCOUNT_JSON?.trim()
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Partial<GscServiceAccount>
    if (!parsed.client_email || !parsed.private_key) return null
    return { client_email: parsed.client_email, private_key: parsed.private_key }
  } catch {
    return null
  }
}

/** URL-prefix property in GSC, e.g. `https://www.webmorp.art/` (trailing slash required). */
export function getGscSiteUrl(): string {
  const fromEnv = process.env.GSC_SITE_URL?.trim()
  if (fromEnv) return fromEnv.endsWith('/') ? fromEnv : `${fromEnv}/`
  return `${siteConfig.url.replace(/\/$/, '')}/`
}

export function getGscSitemapUrl(): string {
  const custom = process.env.GSC_SITEMAP_URL?.trim()
  if (custom) return custom
  return `${siteConfig.url.replace(/\/$/, '')}/sitemap.xml`
}

export function isGscConfigured(): boolean {
  return parseGscServiceAccount() !== null
}

export function gscNotConfiguredBody() {
  return {
    error: 'gsc_not_configured' as const,
    message:
      'Set GSC_SERVICE_ACCOUNT_JSON (service account key JSON) and add the service account email as Owner in Google Search Console.',
  }
}
