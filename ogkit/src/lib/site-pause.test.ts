import { describe, expect, it } from 'vitest'
import { shouldPausePublicPath, WEBMORP_PUBLIC_PAUSED } from './site-pause'

describe('shouldPausePublicPath', () => {
  it('pauses marketing and Channel→Site when the flag is on', () => {
    expect(WEBMORP_PUBLIC_PAUSED).toBe(true)
    expect(shouldPausePublicPath('/')).toBe(true)
    expect(shouldPausePublicPath('/channel')).toBe(true)
    expect(shouldPausePublicPath('/channel/ru')).toBe(true)
    expect(shouldPausePublicPath('/llms.txt')).toBe(true)
    expect(shouldPausePublicPath('/ogkit')).toBe(true)
    expect(shouldPausePublicPath('/ogkit/pricing')).toBe(true)
  })

  it('keeps OGKit API and signed-in app reachable', () => {
    expect(shouldPausePublicPath('/ogkit/api/og/article')).toBe(false)
    expect(shouldPausePublicPath('/api/og/article')).toBe(false)
    expect(shouldPausePublicPath('/ogkit/login')).toBe(false)
    expect(shouldPausePublicPath('/ogkit/dashboard')).toBe(false)
  })
})
