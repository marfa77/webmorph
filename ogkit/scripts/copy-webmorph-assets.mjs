import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..', '..')
const publicDir = path.join(__dirname, '..', 'public')
const siteHost = 'https://www.webmorp.art'

function copyFile(from, to) {
  if (!fs.existsSync(from)) {
    console.warn(`[copy-webmorph-assets] skip (missing): ${from}`)
    return
  }
  fs.mkdirSync(path.dirname(to), { recursive: true })
  fs.copyFileSync(from, to)
  console.log(`[copy-webmorph-assets] ${path.relative(root, to)}`)
}

function copyDir(from, to) {
  if (!fs.existsSync(from)) {
    console.warn(`[copy-webmorph-assets] skip dir (missing): ${from}`)
    return
  }
  fs.mkdirSync(to, { recursive: true })
  for (const name of fs.readdirSync(from)) {
    const s = path.join(from, name)
    const d = path.join(to, name)
    if (fs.statSync(s).isDirectory()) copyDir(s, d)
    else fs.copyFileSync(s, d)
  }
  console.log(`[copy-webmorph-assets] ${path.relative(root, to)}/`)
}

copyFile(path.join(root, 'favicon.svg'), path.join(publicDir, 'favicon.svg'))
for (const name of ['favicon.png', 'apple-touch-icon.png']) {
  const p = path.join(root, name)
  if (fs.existsSync(p)) copyFile(p, path.join(publicDir, name))
}
copyFile(path.join(root, 'og-image.jpg'), path.join(publicDir, 'og-image.jpg'))
copyFile(path.join(root, 'privacy.html'), path.join(publicDir, 'privacy.html'))
copyFile(path.join(root, 'terms.html'), path.join(publicDir, 'terms.html'))
copyFile(path.join(root, 'robots.txt'), path.join(publicDir, 'robots.txt'))
copyFile(path.join(root, 'llms.txt'), path.join(publicDir, 'llms.txt'))
copyFile(path.join(root, 'llms.txt'), path.join(publicDir, 'llm.txt'))

// $100 website service at site root (OGKit lives under /ogkit via NEXT_PUBLIC_BASE_PATH)
copyFile(path.join(root, 'index.html'), path.join(publicDir, 'index.html'))
for (const niche of ['freelancer', 'small-business', 'restaurant', 'startup']) {
  copyDir(path.join(root, niche), path.join(publicDir, niche))
}
copyDir(path.join(root, 'previews'), path.join(publicDir, 'previews'))

const lastmod = new Date().toISOString().slice(0, 10)
const websiteRoutes = [
  { loc: `${siteHost}/`, priority: '1.0', changefreq: 'weekly' },
  { loc: `${siteHost}/freelancer`, priority: '0.9', changefreq: 'monthly' },
  { loc: `${siteHost}/small-business`, priority: '0.9', changefreq: 'monthly' },
  { loc: `${siteHost}/restaurant`, priority: '0.9', changefreq: 'monthly' },
  { loc: `${siteHost}/startup`, priority: '0.9', changefreq: 'monthly' },
  { loc: `${siteHost}/privacy.html`, priority: '0.3', changefreq: 'yearly' },
  { loc: `${siteHost}/terms.html`, priority: '0.3', changefreq: 'yearly' },
  { loc: `${siteHost}/llms.txt`, priority: '0.5', changefreq: 'monthly' },
  { loc: `${siteHost}/llm.txt`, priority: '0.5', changefreq: 'monthly' },
]
const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${websiteRoutes
  .map(
    (entry) => `  <url>
    <loc>${entry.loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>
`
fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemapXml)
console.log('[copy-webmorph-assets] ogkit/public/sitemap.xml (website landings)')
