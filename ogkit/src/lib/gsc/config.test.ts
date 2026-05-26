import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { getGscSiteUrl, getGscSitemapUrl, parseGscServiceAccount } from '@/lib/gsc/config'

describe('gsc config', () => {
  const prev = {
    json: process.env.GSC_SERVICE_ACCOUNT_JSON,
    site: process.env.GSC_SITE_URL,
    sitemap: process.env.GSC_SITEMAP_URL,
  }

  beforeEach(() => {
    delete process.env.GSC_SERVICE_ACCOUNT_JSON
    delete process.env.GSC_SITE_URL
    delete process.env.GSC_SITEMAP_URL
  })

  afterEach(() => {
    process.env.GSC_SERVICE_ACCOUNT_JSON = prev.json
    process.env.GSC_SITE_URL = prev.site
    process.env.GSC_SITEMAP_URL = prev.sitemap
  })

  it('parses service account JSON', () => {
    process.env.GSC_SERVICE_ACCOUNT_JSON = JSON.stringify({
      client_email: 'gsc@project.iam.gserviceaccount.com',
      private_key: '-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----\n',
    })
    expect(parseGscServiceAccount()?.client_email).toBe('gsc@project.iam.gserviceaccount.com')
  })

  it('defaults site URL with trailing slash', () => {
    expect(getGscSiteUrl()).toBe('https://www.webmorp.art/')
  })

  it('defaults sitemap URL', () => {
    expect(getGscSitemapUrl()).toBe('https://www.webmorp.art/sitemap.xml')
  })
})
