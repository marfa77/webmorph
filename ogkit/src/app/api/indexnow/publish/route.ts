import { NextResponse } from 'next/server'
import { isAllowedIndexNowUrl, submitIndexNowUrls } from '@/lib/indexnow'

export const runtime = 'nodejs'

/**
 * POST JSON `{ "urls": string[] }` to ping IndexNow after deploy or content changes.
 * Secured with CRON_SECRET: `Authorization: Bearer <CRON_SECRET>`
 */
export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET?.trim()
  const auth = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? ''
  if (!secret || auth !== secret) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }
  const urls = (body as { urls?: unknown }).urls
  if (!Array.isArray(urls) || urls.some((u) => typeof u !== 'string')) {
    return NextResponse.json({ error: 'urls_must_be_string_array' }, { status: 400 })
  }
  const list = urls as string[]
  for (const u of list) {
    if (!isAllowedIndexNowUrl(u)) {
      return NextResponse.json(
        { error: 'urls_must_be_https_on_site_host', example: 'https://www.webmorp.art/...' },
        { status: 400 },
      )
    }
  }

  const result = await submitIndexNowUrls(list)
  if (!result.ok) {
    return NextResponse.json(
      { error: 'indexnow_request_failed', status: result.status, detail: result.body },
      { status: 502 },
    )
  }
  return NextResponse.json({ ok: true, submitted: urls.length })
}
