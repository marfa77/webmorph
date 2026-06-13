/**
 * Canonical PixID Studio Organization JSON-LD — identical on every property.
 * @id must match https://www.pixid.studio/#org on pixid.studio as well.
 */
export const PIXID_ORGANIZATION = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': 'https://www.pixid.studio/#org',
  name: 'PixID Studio',
  url: 'https://www.pixid.studio/',
  founder: {
    '@type': 'Person',
    name: 'Pavel Veselov',
  },
  sameAs: [
    'https://www.webmorp.art/',
    'https://barakhlo.online/',
    'https://www.pixid.studio/',
    'https://prep2go.study/',
    'https://uaeproperty.vip/',
    'https://truve.online/',
    'https://bench.energy/',
    'https://pveselov.space/',
    'https://uniprep2go.study/',
    'https://sbunkov.ru/',
    'https://inoutcreator.com/',
    'https://github.com/marfa77',
  ],
}

export const PIXID_ORG_ID = 'https://www.pixid.studio/#org'

export const PIXID_PROVIDER_REF = { '@id': PIXID_ORG_ID }

const MARKER_START = '<!-- pixid-org-jsonld:start -->'
const MARKER_END = '<!-- pixid-org-jsonld:end -->'

function formatJsonLd(obj) {
  return JSON.stringify(obj, null, 2)
    .replace(/"([^"]+)":/g, '"$1":')
    .split('\n')
    .map((line, i) => (i === 0 ? line : `    ${line}`))
    .join('\n')
}

export function pixidOrganizationScriptBlock() {
  return `${MARKER_START}
    <script type="application/ld+json">
    ${formatJsonLd(PIXID_ORGANIZATION)}
    </script>
${MARKER_END}`
}

/** Replace marked block, legacy Organization script, or inject before </head>. */
export function upsertPixidOrganization(html) {
  const block = pixidOrganizationScriptBlock()
  const marked = new RegExp(`${MARKER_START}[\\s\\S]*?${MARKER_END}\\n?`, 'm')
  if (marked.test(html)) return html.replace(marked, `${block}\n`)

  const legacyOrg = new RegExp(
    `<script type="application/ld\\+json">\\s*\\{\\s*"@context": "https://schema.org",\\s*"@type": "Organization"[\\s\\S]*?</script>\\n?`,
    'm'
  )
  if (legacyOrg.test(html)) return html.replace(legacyOrg, `${block}\n`)

  return html.replace('</head>', `${block}\n</head>`)
}

/** Point schema.org provider at the shared org node. */
export function normalizeProviderRefs(html) {
  return html.replace(
    /"provider":\s*\{\s*"@type":\s*"Organization"[\s\S]*?\},/g,
    `"provider": ${JSON.stringify(PIXID_PROVIDER_REF)},`
  )
}
