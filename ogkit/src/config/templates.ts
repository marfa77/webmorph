export type TemplateId =
  | 'article'
  | 'product'
  | 'quote'
  | 'podcast'
  | 'event'
  | 'job'
  | 'minimal'
  | 'brand'
  | 'gradient'
  | 'dark-code'

export const TEMPLATE_IDS: TemplateId[] = [
  'article',
  'product',
  'quote',
  'podcast',
  'event',
  'job',
  'minimal',
  'brand',
  'gradient',
  'dark-code',
]

export const TEMPLATE_META: Record<TemplateId, { title: string; description: string }> = {
  article: { title: 'Article', description: 'Blog post with title, subtitle, author, image.' },
  product: { title: 'Product', description: 'E-commerce product card with price.' },
  quote: { title: 'Quote', description: 'Pull quote with author attribution.' },
  podcast: { title: 'Podcast', description: 'Episode card with cover art and show name.' },
  event: { title: 'Event', description: 'Event card with date and location.' },
  job: { title: 'Job', description: 'Job listing with company and location.' },
  minimal: { title: 'Minimal', description: 'Title + subtitle, no frills.' },
  brand: { title: 'Brand', description: 'Centered logo with tagline.' },
  gradient: { title: 'Gradient', description: 'Auto-generated gradient background.' },
  'dark-code': { title: 'Dark Code', description: 'Code snippet with syntax highlighting.' },
}

export function isTemplateId(s: string): s is TemplateId {
  return (TEMPLATE_IDS as readonly string[]).includes(s)
}
