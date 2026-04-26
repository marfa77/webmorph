import { z } from 'zod'
import { isTemplateId, type TemplateId } from '@/config/templates'
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

const optionalUrl = z
  .union([z.string().url(), z.literal('')])
  .optional()
  .transform((v) => (v && v.length > 0 ? v : undefined))

const hexColor = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/)
  .optional()

export const OgParamsSchema = z.object({
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
  theme: z.enum(['light', 'dark', 'classic']).optional(),
  accent: hexColor,
  bg: hexColor,
  font: z.string().max(80).optional(),
  pattern: z.enum(['none', 'dots', 'grid']).optional(),
})

export type OgParams = z.infer<typeof OgParamsSchema>

export function paramsFromSearch(searchParams: URLSearchParams): Record<string, string> {
  const rawParams: Record<string, string> = {}
  searchParams.forEach((value, key) => {
    if (key !== 'key' && key !== 'source' && key !== 'demo' && key !== 'sig' && !key.startsWith('_') && value !== '') {
      rawParams[key] = value
    }
  })
  return rawParams
}

export function parseTemplate(templateParam: string): TemplateId | null {
  return isTemplateId(templateParam) ? templateParam : null
}

export function renderOgTemplate(template: TemplateId, params: OgParams, watermark: boolean) {
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
      return (
        <MinimalTemplate
          title={params.title}
          subtitle={params.subtitle}
          watermark={watermark}
          accent={params.accent}
          bg={params.bg}
          font={params.font}
          pattern={params.pattern}
          theme={params.theme}
        />
      )
    case 'brand':
      return <BrandTemplate title={params.title} tagline={params.tagline} logo={params.logo} watermark={watermark} />
    case 'gradient':
      return (
        <GradientTemplate
          title={params.title}
          subtitle={params.subtitle}
          watermark={watermark}
          accent={params.accent}
          bg={params.bg}
          font={params.font}
          pattern={params.pattern}
        />
      )
    case 'dark-code':
      return <DarkCodeTemplate title={params.title} code={params.code} language={params.language} watermark={watermark} />
  }
}
