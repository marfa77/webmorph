import { absoluteSiteUrl, withBasePath } from '@/config/paths'
import { isTemplateId, TEMPLATE_IDS, type TemplateId } from '@/config/templates'

export type OgUrlOptions = {
  template: TemplateId
  title: string
  subtitle?: string
  author?: string
  image?: string
  logo?: string
  price?: string
  accent?: string
  demo?: boolean
  apiKey?: string
  extraParams?: Record<string, string>
}

export function buildOgImageUrl(options: OgUrlOptions): string {
  const path = withBasePath(`/api/og/${options.template}`)
  const url = new URL(absoluteSiteUrl(path))

  url.searchParams.set('title', options.title)
  if (options.subtitle) url.searchParams.set('subtitle', options.subtitle)
  if (options.author) url.searchParams.set('author', options.author)
  if (options.image) url.searchParams.set('image', options.image)
  if (options.logo) url.searchParams.set('logo', options.logo)
  if (options.price) url.searchParams.set('price', options.price)
  if (options.accent) url.searchParams.set('accent', options.accent)

  for (const [key, value] of Object.entries(options.extraParams ?? {})) {
    if (value) url.searchParams.set(key, value)
  }

  if (options.apiKey) {
    url.searchParams.set('key', options.apiKey)
  } else if (options.demo !== false) {
    url.searchParams.set('demo', '1')
  }

  return url.toString()
}

export function parseTemplateId(value: string): TemplateId | null {
  const normalized = value.trim().toLowerCase()
  return isTemplateId(normalized) ? normalized : null
}

export function listTemplateSummaries() {
  return TEMPLATE_IDS.map((id) => ({ id, path: `/api/og/${id}` }))
}
