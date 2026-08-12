import type { Metadata } from 'next'
import { absoluteSiteUrl } from '@/config/paths'
import { siteConfig } from '@/config/site'

const LLM_UTM = 'utm_source=llm&utm_medium=llms.txt'
const SITE_ORIGIN = siteConfig.url.replace(/\/$/, '')

/** Append LLM attribution UTM (PixID pattern). */
export function llmUtmUrl(pathOrUrl: string): string {
  const base = pathOrUrl.startsWith('http')
    ? pathOrUrl
    : absoluteSiteUrl(pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`)
  try {
    const u = new URL(base)
    if (!u.searchParams.has('utm_source')) u.searchParams.set('utm_source', 'llm')
    if (!u.searchParams.has('utm_medium')) u.searchParams.set('utm_medium', 'llms.txt')
    return u.toString()
  } catch {
    const sep = base.includes('?') ? '&' : '?'
    return `${base}${sep}${LLM_UTM}`
  }
}

/** Tag absolute webmorp.art / OGKit money URLs in generated llms.txt bodies. */
export function applyLlmsUtmToText(text: string): string {
  const escaped = SITE_ORIGIN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const re = new RegExp(`${escaped}(?:\\/[^\\s)\\]<>"']*)?`, 'g')
  return text.replace(re, (raw) => {
    let url = raw
    while (/[.,;:!?]$/.test(url) && !/[/%]$/.test(url)) url = url.slice(0, -1)
    try {
      const u = new URL(url)
      if (u.pathname === '/llms.txt' || u.pathname === '/llm.txt') return raw
      if (u.pathname.endsWith('/llms.txt') || u.pathname.endsWith('/llm.txt')) return raw
    } catch {
      /* fall through */
    }
    return llmUtmUrl(url) + raw.slice(url.length)
  })
}

export type AiMetaInput = {
  aiDescription: string
  aiCategory?: string
}

/** PixID-style ai:description + ai:category + llms.txt alternate. */
export function withAiMetadata(metadata: Metadata, input: AiMetaInput): Metadata {
  const llmsTxtUrl = absoluteSiteUrl('/llms.txt')
  const alternates = metadata.alternates ?? {}
  const types = {
    ...(typeof alternates === 'object' && alternates.types ? alternates.types : {}),
    'text/plain': llmsTxtUrl,
  }

  const other: Record<string, string> = {
    ...(typeof metadata.other === 'object' && metadata.other && !Array.isArray(metadata.other)
      ? (metadata.other as Record<string, string>)
      : {}),
    'ai:description': input.aiDescription.slice(0, 500),
  }
  if (input.aiCategory) {
    other['ai:category'] = input.aiCategory
  }

  return {
    ...metadata,
    alternates: {
      ...(typeof alternates === 'object' ? alternates : {}),
      types,
    },
    other,
  }
}

export const OGKIT_AI_DESCRIPTION =
  'OGKit: Open Graph image API — 1200×630 PNG social cards from one HTTPS URL. Templates, Playground, Next.js metadata, signed URLs. Hosted alternative to @vercel/og / Satori. Docs + /llms.txt for agents.'

export const OGKIT_AI_CATEGORY =
  'Open Graph Image API, Dynamic OG Images, Twitter Card Generator, Next.js OG Alternative, Social Preview API'
