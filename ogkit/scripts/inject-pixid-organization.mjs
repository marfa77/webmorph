/**
 * Inject canonical PixID Organization JSON-LD into all webmorp.art static HTML pages.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  normalizeProviderRefs,
  upsertPixidOrganization,
} from '../../shared/pixid-organization.jsonld.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..', '..')

const HTML_GLOBS = [
  'index.html',
  'freelancer/index.html',
  'small-business/index.html',
  'restaurant/index.html',
  'startup/index.html',
  'channel/index.html',
  'channel/ru/index.html',
  'channel/guides/*.html',
  'privacy.html',
  'terms.html',
]

function expandGlob(rel) {
  if (!rel.includes('*')) return [path.join(root, rel)]
  const [dir, pattern] = rel.split('/')
  const base = path.join(root, dir)
  if (!fs.existsSync(base)) return []
  return fs
    .readdirSync(base)
    .filter((name) => name.endsWith('.html') && (pattern === '*.html' || name === pattern))
    .map((name) => path.join(base, name))
}

const files = HTML_GLOBS.flatMap(expandGlob).filter((f) => fs.existsSync(f))

for (const file of files) {
  let html = fs.readFileSync(file, 'utf8')
  html = normalizeProviderRefs(html)
  html = upsertPixidOrganization(html)
  fs.writeFileSync(file, html)
  console.log('[inject-pixid-organization]', path.relative(root, file))
}
