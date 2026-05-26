import type { OgUrlOptions } from '@/lib/mcp/og-url'
import { buildOgImageUrl } from '@/lib/mcp/og-url'

export type NextJsSnippetOptions = OgUrlOptions & {
  apiKeyEnv?: string
  previewWithDemo?: boolean
}

export function buildNextJsGenerateMetadataSnippet(options: NextJsSnippetOptions): string {
  const apiKeyEnv = options.apiKeyEnv?.trim() || 'OGKIT_API_KEY'
  const usesDemoOnly = options.previewWithDemo ?? !options.apiKey

  if (usesDemoOnly) {
    const imageUrl = buildOgImageUrl({ ...options, demo: true, apiKey: undefined })
    return `import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const imageUrl = ${JSON.stringify(imageUrl)}

  return {
    openGraph: {
      title: ${JSON.stringify(options.title)},
      images: [{ url: imageUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      images: [imageUrl],
    },
  }
}
`
  }

  const urlTemplate = buildOgImageUrl({ ...options, demo: false, apiKey: '__KEY__' })
  const [basePath, query] = urlTemplate.split('?')
  const params = new URLSearchParams(query)
  params.delete('key')
  const staticQuery = params.toString()

  return `import type { Metadata } from 'next'

function buildOgkitImageUrl(key: string) {
  const url = new URL(${JSON.stringify(basePath)})
  const params = new URLSearchParams(${JSON.stringify(staticQuery)})
  params.set('key', key)
  url.search = params.toString()
  return url.toString()
}

export async function generateMetadata(): Promise<Metadata> {
  const key = process.env.${apiKeyEnv}
  if (!key) throw new Error('Missing ${apiKeyEnv}')
  const imageUrl = buildOgkitImageUrl(key)

  return {
    openGraph: {
      title: ${JSON.stringify(options.title)},
      images: [{ url: imageUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      images: [imageUrl],
    },
  }
}
`
}
