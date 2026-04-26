import { ImageResponse } from 'next/og'
import { NextResponse } from 'next/server'
import { authenticateKey } from '@/lib/api/authenticate'
import { checkQuota, recordUsage } from '@/lib/api/quota'
import { verifySignedRequest } from '@/lib/api/signatures'
import { fetchPageMetadata, validateMetadataUrl } from '@/lib/og/metadata'
import { OgParamsSchema, paramsFromSearch, parseTemplate, renderOgTemplate } from '@/lib/og/render'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const pageUrl = validateMetadataUrl(url.searchParams.get('url') ?? '')
  if (!pageUrl) return NextResponse.json({ error: 'invalid_url' }, { status: 400 })

  const key = url.searchParams.get('key') || req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || null
  const isDemo = url.searchParams.get('demo') === '1' && !key

  const auth = isDemo ? null : await authenticateKey(key)
  if (auth && !auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  if (auth?.ok) {
    const signature = verifySignedRequest(url, auth)
    if (!signature.ok) return NextResponse.json({ error: signature.error }, { status: 403 })

    const quota = await checkQuota(auth.userId, auth.plan)
    if (!quota.ok) return NextResponse.json({ error: 'quota_exceeded', cap: quota.cap, period: quota.period }, { status: 429 })
  }

  const meta = await fetchPageMetadata(pageUrl)
  if (!meta) return NextResponse.json({ error: 'metadata_not_found' }, { status: 422 })

  const requestedTemplate = parseTemplate(url.searchParams.get('template') ?? '')
  const template = requestedTemplate ?? (meta.image ? 'article' : 'minimal')
  const rawParams = {
    ...paramsFromSearch(url.searchParams),
    title: url.searchParams.get('title') || meta.title,
    subtitle: url.searchParams.get('subtitle') || meta.description || pageUrl.hostname,
    image: url.searchParams.get('image') || meta.image,
    logo: url.searchParams.get('logo') || meta.favicon,
    accent: url.searchParams.get('accent') || (meta.themeColor?.match(/^#[0-9a-fA-F]{6}$/) ? meta.themeColor : undefined),
  }

  const parsed = OgParamsSchema.safeParse(rawParams)
  if (!parsed.success) return NextResponse.json({ error: 'invalid_params', details: parsed.error.format() }, { status: 400 })

  const element = renderOgTemplate(template, parsed.data, isDemo || (auth?.ok ? auth.watermark : true))
  const imageResponse = new ImageResponse(element, {
    width: 1200,
    height: 630,
    headers: {
      'Cache-Control': 'public, max-age=0, s-maxage=86400, stale-while-revalidate=3600',
    },
  })
  const image = await imageResponse.arrayBuffer()

  if (auth?.ok) {
    void recordUsage({
      userId: auth.userId,
      apiKeyId: auth.apiKeyId,
      template: `auto:${template}`,
      cacheHit: false,
      status: 200,
    }).catch(() => {})
  }

  return new Response(image, { status: imageResponse.status, headers: imageResponse.headers })
}
