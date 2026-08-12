#!/usr/bin/env node
/**
 * PixID Layer A AEO parity for OGKit (Next.js under /ogkit).
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

const llmsBody = read('src/lib/llms-txt-body.ts') || ''
const llmMeta = read('src/lib/llm-meta.ts') || ''
const route = read('src/app/llms.txt/route.ts') || ''

if (llmsBody.length < 500) fail('llms-txt-body.ts', 'missing or too short')
else ok(`llms-txt-body.ts length ${llmsBody.length}`)

const hasUtmHelper =
  llmMeta.includes('utm_source=llm') &&
  llmMeta.includes('applyLlmsUtmToText') &&
  llmsBody.includes('applyLlmsUtmToText')
if (!hasUtmHelper) fail('llms UTM', 'missing applyLlmsUtmToText wiring')
else ok('llms UTM helper wired')

if (!route.includes('buildLlmsTxtBody')) fail('llms.txt route', 'must call buildLlmsTxtBody')
else ok('llms.txt route wired')

const robots = read('src/app/robots.ts') || ''
for (const bot of ['GPTBot', 'Amazonbot', 'YouBot', 'Meta-ExternalAgent', 'OAI-SearchBot']) {
  if (!robots.includes(bot)) fail('robots.ts', `missing ${bot}`)
  else ok(`robots.ts allows ${bot}`)
}

const layout = read('src/app/layout.tsx') || ''
const home = read('src/app/(marketing)/page.tsx') || ''
const pricing = read('src/app/(marketing)/pricing/page.tsx') || ''
const hasAi =
  layout.includes('withAiMetadata') ||
  home.includes('withAiMetadata') ||
  layout.includes('ai:description')
const hasAlternate =
  layout.includes('llms.txt') ||
  llmMeta.includes('llms.txt') ||
  home.includes('llms.txt')

if (!hasAi) fail('layout/home', 'missing withAiMetadata / ai:description')
else ok('ai:description wired')
if (!hasAlternate) fail('layout/home', 'missing llms.txt alternate')
else ok('llms.txt alternate wired')

if (!home.includes('OgkitLlmFacts') && !home.includes('data-llm="facts"')) {
  fail('home page', 'missing LlmFacts / data-llm')
} else ok('home LlmFacts')

if (!pricing.includes('OgkitLlmFacts') && !pricing.includes('data-llm="facts"')) {
  fail('pricing page', 'missing LlmFacts / data-llm')
} else ok('pricing LlmFacts')

const facts = read('src/components/seo/LlmFacts.tsx') || ''
if (!facts.includes('data-llm="facts"')) fail('LlmFacts', 'missing data-llm=facts')
else ok('data-llm facts component')

if (failures.length) {
  console.error(`\n${failures.length} AEO check(s) failed`)
  process.exit(1)
}
console.log('\nAll AEO parity checks passed')
