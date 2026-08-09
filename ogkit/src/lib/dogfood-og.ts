import { absoluteSiteUrl } from '@/config/paths'

export type DogfoodOgOptions = {
  title: string
  subtitle?: string
  template?: string
  accent?: string
}

/** Page-specific OGKit preview URL (dogfood). Always includes /ogkit basePath via absoluteSiteUrl. */
export function dogfoodOgImageUrl(opts: DogfoodOgOptions): string {
  const template = opts.template?.trim() || 'minimal'
  const url = new URL(absoluteSiteUrl(`/api/og/${template}`))
  url.searchParams.set('demo', '1')
  url.searchParams.set('title', opts.title.slice(0, 120))
  if (opts.subtitle?.trim()) url.searchParams.set('subtitle', opts.subtitle.trim().slice(0, 120))
  url.searchParams.set('accent', opts.accent?.trim() || '#0066FF')
  return url.toString()
}

export function ogImageWithAlt(url: string, alt: string) {
  return [{ url, width: 1200 as const, height: 630 as const, alt }]
}
