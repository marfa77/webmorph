import { ImageResponse } from 'next/og'
import { NextResponse } from 'next/server'
import { authenticateKey } from '@/lib/api/authenticate'
import { checkQuota, recordUsage } from '@/lib/api/quota'
import { trackFunnelEvent } from '@/lib/analytics/funnel'
import { OgParamsSchema, paramsFromSearch, parseTemplate, renderOgTemplate } from '@/lib/og/render'
import { verifySignedRequest } from '@/lib/api/signatures'

// nodejs: API key verify uses `node:crypto` (see lib/api/keys); ImageResponse still works in Node.
export const runtime = 'nodejs'

type RouteCtx = { params: { template: string } }

export async function GET(req: Request, context: RouteCtx) {
  const { template: templateParam } = context.params
  const template = parseTemplate(templateParam)
  if (!template) {
    return NextResponse.json({ error: 'unknown_template' }, { status: 404 })
  }

  const url = new URL(req.url)
  const key = url.searchParams.get('key') || req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || null
  const isPlaygroundPreview = url.searchParams.get('source') === 'playground'
  const isDemo = url.searchParams.get('demo') === '1' && !key

  const auth = isDemo ? null : await authenticateKey(key)
  if (auth && !auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  if (auth?.ok) {
    const signature = verifySignedRequest(url, auth)
    if (!signature.ok) return NextResponse.json({ error: signature.error }, { status: 403 })

    const quota = await checkQuota(auth.userId, auth.plan)
    if (!quota.ok) {
      return NextResponse.json({ error: 'quota_exceeded', cap: quota.cap, period: quota.period }, { status: 429 })
    }
  }

  const rawParams = paramsFromSearch(url.searchParams)

  const parsed = OgParamsSchema.safeParse(rawParams)
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_params', details: parsed.error.format() }, { status: 400 })
  }

  const element = renderOgTemplate(template, parsed.data, isDemo || (auth?.ok ? auth.watermark : true))

  const imageResponse = new ImageResponse(element, {
    width: 1200,
    height: 630,
    headers: {
      'Cache-Control': 'public, max-age=0, s-maxage=31536000, stale-while-revalidate=86400',
    },
  })
  const image = await imageResponse.arrayBuffer()

  if (auth?.ok) {
    void recordUsage({
      userId: auth.userId,
      apiKeyId: auth.apiKeyId,
      template,
      cacheHit: false,
      status: 200,
    })
      .then(async ({ isFirstUsage }) => {
        await trackFunnelEvent({
          eventName: 'og_image_generated',
          userId: auth.userId,
          email: auth.userEmail,
          source: isPlaygroundPreview ? 'playground' : 'api',
          properties: { template, plan: auth.plan, apiKeyId: auth.apiKeyId, firstUsage: isFirstUsage },
        })

        if (!isPlaygroundPreview || !isFirstUsage) return

        await trackFunnelEvent({
          eventName: 'first_preview_generated',
          userId: auth.userId,
          email: auth.userEmail,
          source: 'playground',
          properties: { template, plan: auth.plan, apiKeyId: auth.apiKeyId },
          notify: true,
        })
      })
      .catch(() => {})
  }

  return new Response(image, {
    status: imageResponse.status,
    headers: imageResponse.headers,
  })
}
