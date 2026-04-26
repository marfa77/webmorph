import { ImageResponse } from 'next/og'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { isTemplateId, type TemplateId } from '@/config/templates'
import { authenticateKey } from '@/lib/api/authenticate'
import { checkQuota, recordUsage } from '@/lib/api/quota'
import { sendTelegramMessage } from '@/lib/notifications/telegram'
import { ArticleTemplate } from '@/components/og-templates/article'
import { ProductTemplate } from '@/components/og-templates/product'
import { QuoteTemplate } from '@/components/og-templates/quote'
import { PodcastTemplate } from '@/components/og-templates/podcast'
import { EventTemplate } from '@/components/og-templates/event'
import { JobTemplate } from '@/components/og-templates/job'
import { MinimalTemplate } from '@/components/og-templates/minimal'
import { BrandTemplate } from '@/components/og-templates/brand'
import { GradientTemplate } from '@/components/og-templates/gradient'
import { DarkCodeTemplate } from '@/components/og-templates/dark-code'

// nodejs: API key verify uses `node:crypto` (see lib/api/keys); ImageResponse still works in Node.
export const runtime = 'nodejs'

const optionalUrl = z
  .union([z.string().url(), z.literal('')])
  .optional()
  .transform((v) => (v && v.length > 0 ? v : undefined))

const ParamsSchema = z.object({
  title: z.string().min(1).max(300),
  subtitle: z.string().max(500).optional(),
  author: z.string().max(100).optional(),
  image: optionalUrl,
  logo: optionalUrl,
  price: z.string().max(40).optional(),
  date: z.string().max(40).optional(),
  location: z.string().max(100).optional(),
  company: z.string().max(100).optional(),
  episode: z.string().max(40).optional(),
  show: z.string().max(100).optional(),
  tagline: z.string().max(200).optional(),
  code: z.string().max(500).optional(),
  language: z.string().max(40).optional(),
  avatar: optionalUrl,
})

type Params = z.infer<typeof ParamsSchema>

function render(template: TemplateId, params: Params, watermark: boolean) {
  switch (template) {
    case 'article':
      return <ArticleTemplate title={params.title} subtitle={params.subtitle} author={params.author} image={params.image} watermark={watermark} />
    case 'product':
      return <ProductTemplate title={params.title} price={params.price} image={params.image} logo={params.logo} watermark={watermark} />
    case 'quote':
      return <QuoteTemplate title={params.title} author={params.author} avatar={params.avatar} watermark={watermark} />
    case 'podcast':
      return <PodcastTemplate title={params.title} episode={params.episode} show={params.show} image={params.image} watermark={watermark} />
    case 'event':
      return <EventTemplate title={params.title} date={params.date} location={params.location} image={params.image} watermark={watermark} />
    case 'job':
      return <JobTemplate title={params.title} company={params.company} location={params.location} logo={params.logo} watermark={watermark} />
    case 'minimal':
      return <MinimalTemplate title={params.title} subtitle={params.subtitle} watermark={watermark} />
    case 'brand':
      return <BrandTemplate title={params.title} tagline={params.tagline} logo={params.logo} watermark={watermark} />
    case 'gradient':
      return <GradientTemplate title={params.title} subtitle={params.subtitle} watermark={watermark} />
    case 'dark-code':
      return <DarkCodeTemplate title={params.title} code={params.code} language={params.language} watermark={watermark} />
  }
}

type RouteCtx = { params: { template: string } }

export async function GET(req: Request, context: RouteCtx) {
  const { template: templateParam } = context.params
  if (!isTemplateId(templateParam)) {
    return NextResponse.json({ error: 'unknown_template' }, { status: 404 })
  }
  const template = templateParam

  const url = new URL(req.url)
  const key = url.searchParams.get('key') || req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || null
  const isPlaygroundPreview = url.searchParams.get('source') === 'playground'

  const auth = await authenticateKey(key)
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const quota = await checkQuota(auth.userId, auth.plan)
  if (!quota.ok) {
    return NextResponse.json({ error: 'quota_exceeded', cap: quota.cap, period: quota.period }, { status: 429 })
  }

  const rawParams: Record<string, string> = {}
  url.searchParams.forEach((v, k) => {
    if (k !== 'key' && k !== 'source' && !k.startsWith('_') && v !== '') rawParams[k] = v
  })

  const parsed = ParamsSchema.safeParse(rawParams)
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_params', details: parsed.error.format() }, { status: 400 })
  }

  const element = render(template, parsed.data, auth.watermark)

  const imageResponse = new ImageResponse(element, {
    width: 1200,
    height: 630,
    headers: {
      'Cache-Control': 'public, max-age=0, s-maxage=31536000, stale-while-revalidate=86400',
    },
  })
  const image = await imageResponse.arrayBuffer()

  void recordUsage({
    userId: auth.userId,
    apiKeyId: auth.apiKeyId,
    template,
    cacheHit: false,
    status: 200,
  })
    .then(({ isFirstUsage }) => {
      if (!isPlaygroundPreview || !isFirstUsage) return
      return sendTelegramMessage({
        text: [
          'New OGKit user generated a preview',
          `Email: ${auth.userEmail}`,
          `Plan: ${auth.plan}`,
          `Template: ${template}`,
          `Time: ${new Date().toISOString()}`,
        ].join('\n'),
      })
    })
    .catch(() => {})

  return new Response(image, {
    status: imageResponse.status,
    headers: imageResponse.headers,
  })
}
