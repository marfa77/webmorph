export type OgValidationIssue = {
  level: 'error' | 'warn' | 'info'
  message: string
}

export type OgPageValidation = {
  pageUrl: string
  fetched: boolean
  statusCode: number | null
  ogTitle: string | null
  ogDescription: string | null
  ogImage: string | null
  ogImageWidth: string | null
  ogImageHeight: string | null
  twitterCard: string | null
  twitterImage: string | null
  canonical: string | null
  issues: OgValidationIssue[]
}

function metaContent(html: string, property: string): string | null {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`, 'i'),
    new RegExp(`<meta[^>]+name=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${property}["']`, 'i'),
  ]
  for (const re of patterns) {
    const m = html.match(re)
    if (m?.[1]) return m[1]
  }
  return null
}

function linkRel(html: string, rel: string): string | null {
  const re = new RegExp(`<link[^>]+rel=["']${rel}["'][^>]+href=["']([^"']+)["']`, 'i')
  const m = html.match(re)
  return m?.[1] ?? null
}

function resolveMaybeRelative(url: string, base: string): string {
  try {
    return new URL(url, base).toString()
  } catch {
    return url
  }
}

export async function validatePageOpenGraph(pageUrl: string): Promise<OgPageValidation> {
  const issues: OgValidationIssue[] = []
  let statusCode: number | null = null
  let html = ''

  try {
    const res = await fetch(pageUrl, {
      redirect: 'follow',
      headers: { 'User-Agent': 'OGKit-MCP/1.0 (+https://www.webmorp.art)' },
      signal: AbortSignal.timeout(12_000),
    })
    statusCode = res.status
    html = await res.text()
    if (!res.ok) {
      issues.push({ level: 'error', message: `HTTP ${res.status} when fetching page HTML.` })
    }
  } catch (err) {
    issues.push({
      level: 'error',
      message: err instanceof Error ? err.message : 'Failed to fetch page HTML.',
    })
    return {
      pageUrl,
      fetched: false,
      statusCode,
      ogTitle: null,
      ogDescription: null,
      ogImage: null,
      ogImageWidth: null,
      ogImageHeight: null,
      twitterCard: null,
      twitterImage: null,
      canonical: null,
      issues,
    }
  }

  const ogTitle = metaContent(html, 'og:title')
  const ogDescription = metaContent(html, 'og:description')
  let ogImage = metaContent(html, 'og:image')
  const ogImageWidth = metaContent(html, 'og:image:width')
  const ogImageHeight = metaContent(html, 'og:image:height')
  const twitterCard = metaContent(html, 'twitter:card')
  let twitterImage = metaContent(html, 'twitter:image')
  const canonical = linkRel(html, 'canonical')

  if (ogImage) ogImage = resolveMaybeRelative(ogImage, pageUrl)
  if (twitterImage) twitterImage = resolveMaybeRelative(twitterImage, pageUrl)

  if (!ogImage) {
    issues.push({ level: 'error', message: 'Missing og:image — social previews will look broken.' })
  } else if (!/^https:\/\//i.test(ogImage)) {
    issues.push({ level: 'error', message: 'og:image must be an absolute HTTPS URL.' })
  }

  if (!twitterImage && ogImage) {
    issues.push({ level: 'warn', message: 'Missing twitter:image — mirroring og:image is recommended.' })
  }

  if (ogImage && twitterImage && ogImage !== twitterImage) {
    issues.push({ level: 'info', message: 'twitter:image differs from og:image (OK if intentional).' })
  }

  if (!ogTitle) issues.push({ level: 'warn', message: 'Missing og:title.' })
  if (!ogDescription) issues.push({ level: 'info', message: 'Missing og:description.' })

  if (ogImage && (!ogImageWidth || !ogImageHeight)) {
    issues.push({ level: 'info', message: 'Add og:image:width and og:image:height (1200×630).' })
  }

  return {
    pageUrl,
    fetched: true,
    statusCode,
    ogTitle,
    ogDescription,
    ogImage,
    ogImageWidth,
    ogImageHeight,
    twitterCard,
    twitterImage,
    canonical: canonical ? resolveMaybeRelative(canonical, pageUrl) : null,
    issues,
  }
}
