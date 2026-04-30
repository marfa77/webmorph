import { withBasePath } from '@/config/paths'
import { siteConfig } from '@/config/site'

const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow'

export function getIndexNowKeyLocation(): string | null {
  const key = process.env.INDEXNOW_API_KEY?.trim()
  if (!key) return null
  const base = siteConfig.url.replace(/\/$/, '')
  return `${base}${withBasePath('/api/indexnow/key')}`
}

/** Submit URLs to IndexNow (Bing, Yandex, etc.). Requires INDEXNOW_API_KEY and public key file. */
export async function submitIndexNowUrls(urlList: string[]): Promise<{ ok: boolean; status: number; body: string }> {
  const key = process.env.INDEXNOW_API_KEY?.trim()
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
