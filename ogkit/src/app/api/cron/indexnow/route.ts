import { NextResponse } from 'next/server'
import { collectIndexNowUrls, submitIndexNowUrls } from '@/lib/indexnow'

export const runtime = 'nodejs'

/** Weekly cron + manual trigger: submit all website + OGKit URLs to IndexNow. */
export async function GET(request: Request) {
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const urls = collectIndexNowUrls()
  const result = await submitIndexNowUrls(urls)
  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: 'indexnow_request_failed',
        status: result.status,
        detail: result.body,
        urlCount: urls.length,
      },
      { status: 502 },
    )
  }

  return NextResponse.json({
    ok: true,
    pinged: urls.length,
    status: result.status,
    keyLocation: process.env.INDEXNOW_API_KEY
      ? `https://www.webmorp.art/${process.env.INDEXNOW_API_KEY.trim()}.txt`
      : null,
  })
}
