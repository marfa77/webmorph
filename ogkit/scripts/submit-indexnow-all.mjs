#!/usr/bin/env node
/**
 * Submit all website + OGKit URLs to IndexNow (local / post-deploy).
 * Usage: INDEXNOW_API_KEY=... node scripts/submit-indexnow-all.mjs
 */
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const key =
  process.env.INDEXNOW_API_KEY?.trim() ||
  readFileSync(resolve(__dirname, '../../12b40bee030e4be1bd2e571d9f5c43a1.txt'), 'utf8').trim()

const host = 'www.webmorp.art'
const base = `https://${host}`
const ogkit = `${base}/ogkit`

const websitePaths = [
  '/',
  '/freelancer',
  '/small-business',
  '/restaurant',
  '/startup',
  '/channel',
  '/channel/ru',
  '/channel/guides/kak-sdelat-sait-iz-telegram-kanala.html',
  '/channel/guides/sait-iz-telegram-vs-bot.html',
  '/channel/guides/indeksaciya-telegram-google-yandex.html',
  '/channel/guides/telegram-channel-to-website.html',
  '/telegram-sait',
  '/sait-iz-telegram-kanala',
  '/africa-dream',
  '/privacy.html',
  '/terms.html',
  '/llms.txt',
  '/llm.txt',
]

const ogkitPaths = [
  '',
  '/docs',
  '/blog',
  '/blog/open-graph-images-seo-guide',
  '/playground',
  '/pricing',
  '/tools',
  '/contact',
  '/privacy',
  '/terms',
  '/llms.txt',
  '/llm.txt',
  '/for/nextjs',
  '/for/react',
  '/for/remix',
  '/for/astro',
  '/for/nuxt',
  '/for/svelte',
  '/for/rails',
  '/for/django',
  '/for/laravel',
  '/for/hugo',
  '/compare/ogkit-vs-vercel-og',
  '/compare/ogkit-vs-metashot',
  '/compare/ogkit-vs-ogmagic',
  '/compare/ogkit-vs-bannerbear',
  '/compare/ogkit-vs-placid',
  '/compare/ogkit-vs-screenshot-apis',
  '/compare/ogkit-vs-cloudinary',
  '/compare/ogkit-vs-ogforge',
  '/compare/satori-vs-puppeteer',
  '/platform/vercel',
  '/platform/netlify',
  '/platform/cloudflare',
  '/platform/self-hosted',
  '/use-case/dynamic-social-preview-images',
  '/use-case/blog',
  '/use-case/changelog',
  '/use-case/product-launch',
  '/use-case/docs',
  '/use-case/saas',
  '/use-case/ecommerce',
  '/use-case/portfolios',
]

const urlList = [
  ...new Set([
    ...websitePaths.map((p) => (p === '/' ? `${base}/` : `${base}${p}`)),
    ...ogkitPaths.map((p) => (p === '' ? ogkit : `${ogkit}${p}`)),
  ]),
]

async function main() {
  const keyLocation = `${base}/${key}.txt`
  console.log(`IndexNow: ${urlList.length} URLs, keyLocation=${keyLocation}`)

  const keyCheck = await fetch(keyLocation)
  if (!keyCheck.ok) {
    console.error(`Key file not reachable (${keyCheck.status}). Deploy first, then re-run.`)
    process.exit(1)
  }
  const keyBody = (await keyCheck.text()).trim()
  if (keyBody !== key) {
    console.error('Key file body mismatch')
    process.exit(1)
  }
  console.log('Key file OK')

  const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host, key, keyLocation, urlList }),
  })
  const body = await res.text()
  console.log(`IndexNow (api.indexnow.org): HTTP ${res.status}`, body || '(empty)')

  const bingRes = await fetch('https://www.bing.com/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host, key, keyLocation, urlList }),
  })
  const bingBody = await bingRes.text()
  console.log(`IndexNow (bing.com): HTTP ${bingRes.status}`, bingBody || '(empty)')

  if (!(res.ok || res.status === 202) && !(bingRes.ok || bingRes.status === 202)) process.exit(1)
  console.log('Submitted successfully')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
