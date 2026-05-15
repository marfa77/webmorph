import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { hashGumroadLicenseKey } from './hash-license-key'

describe('hashGumroadLicenseKey', () => {
  const prev = {
    pepper: process.env.GUMROAD_LICENSE_HASH_PEPPER,
    auth: process.env.AUTH_SECRET,
  }

  beforeEach(() => {
    process.env.GUMROAD_LICENSE_HASH_PEPPER = 'test-pepper'
    delete process.env.AUTH_SECRET
  })

  afterEach(() => {
    process.env.GUMROAD_LICENSE_HASH_PEPPER = prev.pepper
    process.env.AUTH_SECRET = prev.auth
  })

  it('normalizes casing and whitespace deterministically', () => {
    const a = hashGumroadLicenseKey('  Abc-123  ')
    const b = hashGumroadLicenseKey('abc-123')
    expect(a).toBe(b)
    expect(a).toMatch(/^[a-f0-9]{64}$/)
  })
})
