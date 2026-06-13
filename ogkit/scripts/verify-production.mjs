#!/usr/bin/env node
/**
 * Post-deploy smoke test for www.webmorp.art
 * Usage: node scripts/verify-production.mjs [baseUrl]
 */
const BASE = (process.argv[2] || 'https://www.webmorp.art').replace(/\/$/, '')

const failures = []

async function get(path, { redirect = 'follow' } = {}) {
  const res = await fetch(`${BASE}${path}`, { redirect })
  const body = await res.text()
  return { code: res.status, body, url: res.url }
}

function ok(label) {
  console.log(`OK  ${label}`)
}

function fail(label, detail = '') {
  console.log(`FAIL ${label}${detail ? ` — ${detail}` : ''}`)
  failures.push(label)
}

async function expect200(path, label = path) {
  const { code, body } = await get(path)
  if (code === 200) {
    ok(label)
    return body
  }
  fail(label, `HTTP ${code}`)
  return ''
}

async function expectRedirect(path, expectedFinalPrefix, label = path) {
  const { code, url } = await get(path, { redirect: 'follow' })
  if (code === 200 && url.startsWith(expectedFinalPrefix)) {
    ok(`${label} → ${url.replace(BASE, '')}`)
    return
  }
  fail(label, `got ${code} ${url}`)
}

async function main() {
  console.log(`\nVerifying ${BASE}\n`)

  console.log('Website landings')
  for (const p of ['/', '/freelancer', '/small-business', '/restaurant', '/startup', '/privacy.html', '/terms.html']) {
    await expect200(p)
  }

  console.log('\nSEO / LLM')
  const robots = await expect200('/robots.txt')
  if (robots && (!robots.includes('GPTBot') || !robots.includes('Sitemap:'))) fail('robots.txt content')
  else if (robots) ok('robots.txt has AI bots + sitemaps')

  const sitemap = await expect200('/sitemap.xml')
  const urlCount = (sitemap.match(/<loc>/g) || []).length
  if (urlCount === 9) ok('website sitemap has 9 URLs')
  else fail('website sitemap URL count', String(urlCount))

  const llms = await expect200('/llms.txt')
  if (llms.startsWith('# webmorp.art')) ok('root llms.txt is website corpus')
  else fail('root llms.txt header')

  const llm = await expect200('/llm.txt')
  if (llm.startsWith('# webmorp.art')) ok('llm.txt alias')
  else fail('llm.txt alias')

  console.log('\nStatic assets')
  for (const p of ['/favicon.svg', '/og-image.jpg', '/previews/sbunkov-home.png']) {
    await expect200(p)
  }

  console.log('\nOGKit')
  for (const p of ['/ogkit', '/ogkit/docs', '/ogkit/pricing', '/ogkit/playground', '/ogkit/robots.txt', '/ogkit/sitemap.xml']) {
    await expect200(p)
  }
  const ogkitLlms = await expect200('/ogkit/llms.txt')
  if (ogkitLlms.startsWith('# OGKit')) ok('ogkit llms.txt is OGKit corpus')
  else fail('ogkit llms.txt header')

  if (llms && ogkitLlms && llms !== ogkitLlms) ok('root vs ogkit llms differ')
  else fail('root vs ogkit llms should differ')

  console.log('\nLegacy redirects')
  await expectRedirect('/docs', `${BASE}/ogkit/docs`)
  await expectRedirect('/pricing', `${BASE}/ogkit/pricing`)
  await expectRedirect('/blog', `${BASE}/ogkit/blog`)
  await expectRedirect('/login', `${BASE}/ogkit/login`)
  await expectRedirect('/website', `${BASE}/`)

  console.log('\nOGKit API')
  const ogRes = await fetch(`${BASE}/ogkit/api/og/minimal?demo=1&title=Verify&subtitle=webmorp.art`)
  const ogType = ogRes.headers.get('content-type') || ''
  if (ogRes.status === 200 && ogType.includes('image/png')) ok('OG API demo PNG')
  else fail('OG API demo', `HTTP ${ogRes.status} ${ogType}`)

  console.log('\nHomepage SEO')
  const home = await expect200('/')
  if (home.includes('rel="canonical" href="https://www.webmorp.art/"')) ok('canonical /')
  else fail('canonical /')
  if (home.includes('"@type": "FAQPage"') && home.includes('"@type": "ItemList"')) ok('JSON-LD FAQ + ItemList')
  else fail('JSON-LD on homepage')
  if (home.includes('pveselov.space') && home.includes('sbunkov.ru')) ok('portfolio on homepage')
  else fail('portfolio on homepage')

  console.log(`\n${failures.length ? `FAILED (${failures.length})` : 'ALL CHECKS PASSED'}\n`)
  process.exit(failures.length ? 1 : 0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
