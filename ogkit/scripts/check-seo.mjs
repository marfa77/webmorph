#!/usr/bin/env node
/**
 * Static SEO checks for App Router pages: H1 count, metadata title shape, Image alt.
 * Run via `pnpm seo:check` (also chained after `next lint`).
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const appDir = path.join(__dirname, '..', 'src', 'app')

/** Remove example snippets so we do not flag embedded `export const metadata` in docs. */
function stripCodeBlocks(src) {
  return src.replace(/<CodeBlock>\{`[\s\S]*?`\}<\/CodeBlock>/g, '')
}

function* walkPageTsx(dir) {
  if (!fs.existsSync(dir)) return
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name.startsWith('.')) continue
    const p = path.join(dir, ent.name)
    if (ent.isDirectory()) yield* walkPageTsx(p)
    else if (ent.name === 'page.tsx') yield p
  }
}

const errors = []

for (const file of walkPageTsx(appDir)) {
  if (file.includes(`${path.sep}api${path.sep}`)) continue

  const rel = path.relative(path.join(__dirname, '..'), file)
  const raw = fs.readFileSync(file, 'utf8')
  const src = stripCodeBlocks(raw)

  const isMarketing = file.includes(`${path.sep}(marketing)${path.sep}`)
  const isDynamic = file.includes('[')

  if (isMarketing) {
    const h1 = (src.match(/<h1[\s>/]/gi) ?? []).length
    if (isDynamic) {
      if (h1 < 1 || h1 > 2) errors.push(`${rel}: expected 1–2 <h1> (exclusive branches), found ${h1}`)
    } else if (h1 !== 1) {
      errors.push(`${rel}: expected exactly 1 <h1>, found ${h1}`)
    }
  }

  const hasGenerateMetadata = /export\s+function\s+generateMetadata\b/.test(src)
  const hasMetadataHelper =
    /\bmarketingMetadata\s*\(/.test(src) || /\bprivateAppMetadata\s*\(/.test(src)
  const hasAbsoluteTitle = /title:\s*\{\s*absolute\s*:/.test(src)

  if (/export\s+const\s+metadata\b/.test(src)) {
    if (!hasMetadataHelper && !hasAbsoluteTitle) {
      errors.push(`${rel}: metadata export must use marketingMetadata(), privateAppMetadata(), or title: { absolute: … }`)
    }
  }

  if (hasGenerateMetadata && !hasAbsoluteTitle) {
    errors.push(`${rel}: generateMetadata must return title: { absolute: … }`)
  }

  let pos = 0
  while (true) {
    const i = src.indexOf('<Image', pos)
    if (i === -1) break
    const chunk = src.slice(i, i + 500)
    if (!/\balt\s*=/.test(chunk)) errors.push(`${rel}: <Image> near offset ${i} missing alt= in following 500 chars`)
    pos = i + 6
  }
}

if (errors.length) {
  console.error('SEO check failed:\n')
  for (const e of errors) console.error(`  • ${e}`)
  process.exit(1)
}

console.log('SEO check: OK')
