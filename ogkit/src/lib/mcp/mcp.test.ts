import { describe, expect, it } from 'vitest'
import { buildNextJsGenerateMetadataSnippet } from '@/lib/mcp/nextjs-snippet'
import { buildOgImageUrl, parseTemplateId } from '@/lib/mcp/og-url'

describe('mcp og-url', () => {
  it('builds demo URL with demo=1', () => {
    const url = buildOgImageUrl({ template: 'minimal', title: 'Hello', demo: true })
    expect(url).toContain('https://www.webmorp.art/api/og/minimal')
    expect(url).toContain('demo=1')
    expect(url).toContain('title=Hello')
  })

  it('builds production URL with key', () => {
    const url = buildOgImageUrl({
      template: 'article',
      title: 'Post',
      apiKey: 'ogk_live_test',
      demo: false,
    })
    expect(url).toContain('key=ogk_live_test')
    expect(url).not.toContain('demo=1')
  })

  it('parses template ids', () => {
    expect(parseTemplateId('Article')).toBe('article')
    expect(parseTemplateId('unknown')).toBeNull()
  })
})

describe('mcp nextjs snippet', () => {
  it('generates demo metadata snippet', () => {
    const code = buildNextJsGenerateMetadataSnippet({
      template: 'minimal',
      title: 'Hello',
      previewWithDemo: true,
    })
    expect(code).toContain('generateMetadata')
    expect(code).toContain('demo=1')
    expect(code).toContain('summary_large_image')
  })

  it('generates production snippet with env var', () => {
    const code = buildNextJsGenerateMetadataSnippet({
      template: 'article',
      title: 'Post',
      previewWithDemo: false,
      apiKeyEnv: 'OGKIT_API_KEY',
    })
    expect(code).toContain('process.env.OGKIT_API_KEY')
    expect(code).toContain('buildOgkitImageUrl')
  })
})
