type ExtractedMetadata = {
  title: string
  description?: string
  image?: string
  favicon?: string
  themeColor?: string
}

const PRIVATE_HOSTS = /(^localhost$|(^|\.)local$|^127\.|^10\.|^192\.168\.|^172\.(1[6-9]|2\d|3[01])\.)/i

function absoluteUrl(value: string | undefined, base: URL): string | undefined {
  if (!value) return undefined
  try {
    const url = new URL(value, base)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : undefined
  } catch {
    return undefined
  }
}

function firstMeta(html: string, names: string[]): string | undefined {
  for (const name of names) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const propertyFirst = new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`, 'i')
    const contentFirst = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escaped}["'][^>]*>`, 'i')
    const match = html.match(propertyFirst) ?? html.match(contentFirst)
    if (match?.[1]) return match[1].trim()
  }
  return undefined
}

function titleTag(html: string): string | undefined {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  return match?.[1]?.replace(/\s+/g, ' ').trim()
}

function firstLink(html: string, rels: string[]): string | undefined {
  for (const rel of rels) {
    const escaped = rel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const relFirst = new RegExp(`<link[^>]+rel=["'][^"']*${escaped}[^"']*["'][^>]+href=["']([^"']+)["'][^>]*>`, 'i')
    const hrefFirst = new RegExp(`<link[^>]+href=["']([^"']+)["'][^>]+rel=["'][^"']*${escaped}[^"']*["'][^>]*>`, 'i')
    const match = html.match(relFirst) ?? html.match(hrefFirst)
    if (match?.[1]) return match[1].trim()
  }
  return undefined
}

export function validateMetadataUrl(value: string): URL | null {
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
    if (PRIVATE_HOSTS.test(url.hostname)) return null
    return url
  } catch {
    return null
  }
}

export async function fetchPageMetadata(pageUrl: URL): Promise<ExtractedMetadata | null> {
  const response = await fetch(pageUrl, {
    headers: { accept: 'text/html,application/xhtml+xml' },
    signal: AbortSignal.timeout(5000),
  })
  if (!response.ok) return null

  const html = (await response.text()).slice(0, 250_000)
  const title = firstMeta(html, ['og:title', 'twitter:title']) ?? titleTag(html)
  if (!title) return null

  const description = firstMeta(html, ['og:description', 'twitter:description', 'description'])
  const image = absoluteUrl(firstMeta(html, ['og:image', 'twitter:image']), pageUrl)
  const favicon = absoluteUrl(firstLink(html, ['icon', 'shortcut icon', 'apple-touch-icon']), pageUrl)
  const themeColor = firstMeta(html, ['theme-color'])

  return { title, description, image, favicon, themeColor }
}
