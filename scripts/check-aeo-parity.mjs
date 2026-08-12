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
}

if (failures.length) {
  console.error(`\n${failures.length} AEO check(s) failed`)
  process.exit(1)
}
console.log('\nAll AEO parity checks passed')
