/**
 * Injects shared GEO/SEO head tags and syncs JSON-LD blocks from index.html to niche landings.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..', '..')
const siteHost = 'https://www.webmorp.art'

const WEBSITE_SEO_EXTRA = `
    <meta property="og:locale" content="en_US">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta name="twitter:site" content="@webmorp_art">
    <meta name="twitter:creator" content="@webmorp_art">
    <link rel="alternate" type="text/plain" href="${siteHost}/llms.txt" title="LLM-readable site summary">
    <link rel="alternate" type="text/plain" href="${siteHost}/llm.txt" title="LLM-readable site summary (alias)">
    <link rel="sitemap" type="application/xml" title="Sitemap" href="${siteHost}/sitemap.xml">
`

const PORTFOLIO_ITEM_LIST = `
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": "webmorp.art portfolio — recent client card sites",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "pveselov.space", "url": "https://pveselov.space/" },
        { "@type": "ListItem", "position": 2, "name": "uniprep2go.study", "url": "https://uniprep2go.study/" },
        { "@type": "ListItem", "position": 3, "name": "sbunkov.ru", "url": "https://sbunkov.ru/" }
      ]
    }
    </script>`

const ORGANIZATION_JSONLD = `
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "PixID Studio",
      "url": "https://www.pixid.studio/",
      "email": "customer@pixid.studio",
      "sameAs": [
        "https://www.pixid.studio/",
        "https://github.com/marfa77/webmorph",
        "https://www.webmorp.art/ogkit"
      ],
      "brand": { "@type": "Brand", "name": "webmorp.art" }
    }
    </script>`

const MARKER_START = '<!-- website-seo-extra:start -->'
const MARKER_END = '<!-- website-seo-extra:end -->'
const BLOCK = `${MARKER_START}${WEBSITE_SEO_EXTRA}${MARKER_END}\n`
const PORTFOLIO_MARKER = '<!-- portfolio-itemlist -->'

const indexPath = path.join(root, 'index.html')
const indexHtml = fs.readFileSync(indexPath, 'utf8')

function extractJsonLdBlock(html, type) {
  const re = new RegExp(
    `<script type="application/ld\\+json">\\s*\\{\\s*"@context": "https://schema.org",\\s*"@type": "${type}"[\\s\\S]*?</script>`,
    'm'
  )
  const m = html.match(re)
  if (!m) throw new Error(`Missing ${type} JSON-LD in index.html`)
  return m[0]
}

const howToBlock = extractJsonLdBlock(indexHtml, 'HowTo')
const faqBlock = extractJsonLdBlock(indexHtml, 'FAQPage')

function upsertBlock(html, block, anchor) {
  const re = new RegExp(`${MARKER_START}[\\s\\S]*?${MARKER_END}\\n?`, 'm')
  if (re.test(html)) return html.replace(re, block)
  return html.replace(anchor, `${block}\n${anchor}`)
}

function replaceJsonLd(html, type, replacement) {
  const re = new RegExp(
    `<script type="application/ld\\+json">\\s*\\{\\s*"@context": "https://schema.org",\\s*"@type": "${type}"[\\s\\S]*?</script>`,
    'm'
  )
  return html.replace(re, replacement)
}

function upsertPortfolio(html) {
  if (html.includes(PORTFOLIO_MARKER)) return html
  return html.replace(
    '<script type="application/ld+json">\n    {\n      "@context": "https://schema.org",\n      "@type": "BreadcrumbList",',
    `${PORTFOLIO_ITEM_LIST}\n${ORGANIZATION_JSONLD}\n${PORTFOLIO_MARKER}\n    <script type="application/ld+json">\n    {\n      "@context": "https://schema.org",\n      "@type": "BreadcrumbList",`
  )
}

function syncDescriptions(html) {
  return html
    .replace(
      '<meta property="og:description" content="Professional static website for $100, delivered in 24 hours.">',
      '<meta property="og:description" content="Business card websites for $100 in 24 hours — your texts and design, or we create both. Static HTML, 100 PageSpeed.">'
    )
    .replace(
      '<meta name="twitter:description" content="Professional static website for $100, delivered in 24 hours. Pure HTML/CSS, 100 PageSpeed.">',
      '<meta name="twitter:description" content="Business card websites for $100 in 24 hours — your content or we create it. Static HTML, 100 PageSpeed.">'
    )
    .replace(
      '"description": "Professional static website for $100, delivered in 24 hours. Pure HTML/CSS, 100 PageSpeed, zero maintenance."',
      '"description": "Business card websites for $100 in 24 hours. Built from client texts and design, or written and designed by webmorp.art when the client has none. Static HTML/CSS, 95–100 PageSpeed."'
    )
    .replace(
      '"description": "$100 professional static website delivered in 24 hours — webmorp.art"',
      '"description": "$100 business card websites in 24 hours — your content or we create it. Static HTML at webmorp.art"'
    )
}

function upsertFooterLlmsLink(html) {
  const needle = '<a href="/ogkit" class="hover:text-white/60 transition-colors">OGKit</a>'
  const replacement =
    '<a href="/ogkit" class="hover:text-white/60 transition-colors">OGKit</a>\n                    <a href="/llms.txt" class="hover:text-white/60 transition-colors">LLM summary</a>'
  if (html.includes('href="/llms.txt"')) return html
  return html.replace(needle, replacement)
}

const files = [
  indexPath,
  ...['freelancer', 'small-business', 'restaurant', 'startup'].map((d) => path.join(root, d, 'index.html')),
]

for (const file of files) {
  let html = fs.readFileSync(file, 'utf8')
  html = syncDescriptions(html)
  html = upsertBlock(html, BLOCK, '<link rel="icon" type="image/svg+xml" href="/favicon.svg">')
  html = replaceJsonLd(html, 'HowTo', howToBlock)
  html = replaceJsonLd(html, 'FAQPage', faqBlock)
  if (file === indexPath) html = upsertPortfolio(html)
  html = upsertFooterLlmsLink(html)
  fs.writeFileSync(file, html)
  console.log('[sync-website-seo-head]', path.relative(root, file))
}
