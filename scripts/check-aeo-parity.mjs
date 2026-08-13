#!/usr/bin/env node
/**
 * PixID Layer A AEO parity for webmorp.art (static site root).
 *   node scripts/check-aeo-parity.mjs
 *   npm run check:aeo
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const failures = []

function ok(label) {
  console.log(`OK  ${label}`)
}
function fail(label, detail = '') {
  console.log(`FAIL ${label}${detail ? ` — ${detail}` : ''}`)
  failures.push(label)
}

function read(rel) {
  const p = path.join(root, rel)
  if (!fs.existsSync(p)) return null
  return fs.readFileSync(p, 'utf8')
}

const PIXID_AI_BOTS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-Web',
  'PerplexityBot',
  'Amazonbot',
  'YouBot',
  'Applebot-Extended',
  'cohere-ai',
  'Meta-ExternalAgent',
  'Google-Extended',
]

const MONEY_PAGES = [
  'index.html',
  'channel/index.html',
  'freelancer/index.html',
  'small-business/index.html',
  'restaurant/index.html',
  'startup/index.html',
]

const llms = read('llms.txt')
if (!llms || llms.length < 500) fail('llms.txt', 'missing or too short')
else {
  ok(`llms.txt length ${llms.length}`)
  if (!llms.includes('utm_source=llm') || !llms.includes('utm_medium=llms.txt')) {
    fail('llms.txt UTM', 'missing utm_source=llm&utm_medium=llms.txt on money URLs')
  } else ok('llms.txt has LLM UTMs')
}

const robots = read('robots.txt')
if (!robots) fail('robots.txt', 'missing')
else {
  for (const bot of PIXID_AI_BOTS) {
    if (!robots.includes(bot)) fail('robots.txt', `missing ${bot}`)
    else ok(`robots.txt allows ${bot}`)
  }
}

for (const rel of MONEY_PAGES) {
  const html = read(rel)
  if (!html) {
    fail(rel, 'missing')
    continue
  }
  if (!html.includes('name="ai:description"')) fail(rel, 'missing ai:description')
  else ok(`${rel} ai:description`)
  if (!html.includes('name="ai:category"')) fail(rel, 'missing ai:category')
  else ok(`${rel} ai:category`)
  if (!html.includes('/llms.txt')) fail(rel, 'missing llms.txt alternate')
  else ok(`${rel} llms alternate`)
  if (!html.includes('data-llm="facts"')) fail(rel, 'missing data-llm=facts')
  else ok(`${rel} data-llm facts`)

  // Guard: broken ai:* meta from String.replace("$100" → …$1…) corrupting attributes.
  const aiDesc = html.match(/name="ai:description"\s+content="([^"]*)"/)
  const aiCat = html.match(/name="ai:category"\s+content="([^"]*)"/)
  if (aiDesc && /<meta\b/i.test(aiDesc[1])) {
    fail(rel, 'ai:description embeds nested <meta (broken HTML — visible junk in browser)')
  } else if (aiDesc) {
    ok(`${rel} ai:description is a clean attribute`)
  }
  if (aiCat && /<meta\b/i.test(aiCat[1])) {
    fail(rel, 'ai:category embeds nested <meta')
  } else if (aiCat) {
    ok(`${rel} ai:category is a clean attribute`)
  }
  if (/^00\b/m.test(html) || /\b00\/year\b/.test(html) || /\b00 one-page\b/.test(html)) {
    fail(rel, 'orphaned "00…" text ($100 eaten by replace $1) — shows at top of page')
  } else {
    ok(`${rel} no $100→00 corruption`)
  }
  if (/\.hero-gradient\s*\{[^}]*\bbackground:\s*radial-gradient/.test(html)) {
    fail(rel, 'hero-gradient uses background: shorthand (wipes bg-surface-dark → white-on-white)')
  } else if (html.includes('hero-gradient')) {
    ok(`${rel} hero-gradient preserves background-color`)
  }

  // Guard: JS String.replace($1) must never eat "$100" into a nested <body> capture.
  const layer = html.match(/llm-aeo-layer:start([\s\S]*?)llm-aeo-layer:end/)
  if (layer && /<body[\s>]/i.test(layer[1])) {
    fail(rel, 'nested <body> inside llm-aeo-layer (likely $100 → $1 replace bug)')
  } else if (layer) {
    ok(`${rel} llm layer has no nested body`)
  }
  if (layer && !/\$100\b/.test(layer[1]) && rel !== 'channel/index.html') {
    // money pages except channel should mention $100 card price in layer
    fail(rel, 'llm layer missing $100 (possible price corruption)')
  } else if (layer && /\$100\b/.test(layer[1])) {
    ok(`${rel} llm layer keeps $100`)
  }
}

if (failures.length) {
  console.error(`\n${failures.length} AEO check(s) failed`)
  process.exit(1)
}
console.log('\nAll AEO parity checks passed')
