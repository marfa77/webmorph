import { describe, expect, it } from 'vitest'
import { buildPlaygroundNextJsSnippet, playgroundFieldsToOgOptions } from '@/lib/playground/snippet-from-fields'

describe('playground snippet', () => {
  it('maps fields to OgUrlOptions with demo when no key', () => {
    const options = playgroundFieldsToOgOptions('article', { title: 'Hello', subtitle: 'World' }, '')
    expect(options.demo).toBe(true)
    expect(options.apiKey).toBeUndefined()
    expect(options.subtitle).toBe('World')
  })

  it('includes api key for production snippet', () => {
    const options = playgroundFieldsToOgOptions('minimal', { title: 'Hi' }, 'ogk_live_test123456789012345678901234')
    expect(options.demo).toBe(false)
    expect(options.apiKey).toMatch(/^ogk_live_/)
  })

  it('builds generateMetadata snippet', () => {
    const code = buildPlaygroundNextJsSnippet('minimal', { title: 'Ship notes' }, '')
    expect(code).toContain('generateMetadata')
    expect(code).toContain('demo=1')
    expect(code).toContain('Ship notes')
  })

  it('returns null without title', () => {
    expect(buildPlaygroundNextJsSnippet('minimal', {}, '')).toBeNull()
  })
})
