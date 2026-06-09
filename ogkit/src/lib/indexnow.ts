import { absoluteSiteUrl, withBasePath } from '@/config/paths'
import { siteConfig } from '@/config/site'

const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow'

/** Website landings at site root (see scripts/copy-webmorph-assets.mjs sitemap). */
const WEBSITE_PATHS = [
  '/',
  '/freelancer',
  '/small-business',
  '/restaurant',
  '/startup',
  '/privacy.html',
  '/terms.html',
  '/llms.txt',
  '/llm.txt',
] as const

/** OGKit app routes (keep in sync with src/app/sitemap.ts). */
const OGKIT_PATHS = [
  '',
  '/docs',
  '/blog',
  '/blog/open-graph-images-seo-guide',
  '/playground',
  '/pricing',
  '/tools',
  '/contact',
  '/privacy',
  '/terms',
  '/llms.txt',
  '/llm.txt',
  '/for/nextjs',
  '/for/react',
  '/for/remix',
  '/for/astro',
  '/for/nuxt',
  '/for/svelte',
  '/for/rails',
  '/for/django',
  '/for/laravel',
  '/for/hugo',
  '/compare/ogkit-vs-vercel-og',
  '/compare/ogkit-vs-metashot',
  '/compare/ogkit-vs-ogmagic',
  '/compare/ogkit-vs-bannerbear',
  '/compare/ogkit-vs-placid',
  '/compare/ogkit-vs-screenshot-apis',
  '/compare/ogkit-vs-cloudinary',
  '/compare/ogkit-vs-ogforge',
  '/compare/satori-vs-puppeteer',
  '/platform/vercel',
  '/platform/netlify',
  '/platform/cloudflare',
  '/platform/self-hosted',
  '/use-case/dynamic-social-preview-images',
  '/use-case/blog',
  '/use-case/changelog',
  '/use-case/product-launch',
  '/use-case/docs',
  '/use-case/saas',
  '/use-case/ecommerce',
  '/use-case/portfolios',
] as const

export function getIndexNowKey(): string | null {
  const key = process.env.INDEXNOW_API_KEY?.trim()
  return key || null
}

export function getIndexNowKeyLocation(): string | null {
  const key = getIndexNowKey()
  if (!key) return null
  const base = siteConfig.url.replace(/\/$/, '')
  return `${base}/${key}.txt`
}

export function isAllowedIndexNowUrl(url: string): boolean {
  try {
    const parsed = new URL(url.trim())
    return parsed.protocol === 'https:' && parsed.host === new URL(siteConfig.url).host
  } catch {
    return false
  }
}

export function collectIndexNowUrls(): string[] {
  const base = siteConfig.url.replace(/\/$/, '')
  const website = WEBSITE_PATHS.map((path) => (path === '/' ? `${base}/` : `${base}${path}`))
  const ogkit = OGKIT_PATHS.map((route) => absoluteSiteUrl(route === '' ? '' : route))
  return Array.from(new Set([...website, ...ogkit]))
}

/** Submit URLs to IndexNow (Bing, Yandex, etc.). Requires INDEXNOW_API_KEY and public key file. */
export async function submitIndexNowUrls(urlList: string[]): Promise<{ ok: boolean; status: number; body: string }> {
  const key = getIndexNowKey()
  if (!key || urlList.length === 0) {
    return { ok: false, status: 400, body: 'missing_key_or_urls' }
  }
  const keyLocation = getIndexNowKeyLocation()
  if (!keyLocation) {
    return { ok: false, status: 500, body: 'key_location_unavailable' }
  }
  const host = new URL(siteConfig.url).host
  const res = await fetch(INDEXNOW_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      host,
      key,
      keyLocation,
      urlList: urlList.slice(0, 10_000),
    }),
  })
  const body = await res.text()
  return { ok: res.ok, status: res.status, body: body.slice(0, 500) }
}

/** Legacy API key route path (still works if linked from docs). */
export function getIndexNowApiKeyPath(): string {
  return withBasePath('/api/indexnow/key')
}
