import Link from 'next/link'
import { absoluteSiteUrl, getApiUrl, withBasePath } from '@/config/paths'
import { TEMPLATE_IDS, TEMPLATE_META } from '@/config/templates'
import { siteConfig } from '@/config/site'
import { marketingMetadata } from '@/lib/marketing-metadata'
import { breadcrumbListJsonLd } from '@/lib/breadcrumbs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata = marketingMetadata({
  title: 'OGKit API — Open Graph URLs, templates, keys & signed URLs',
  description:
    'GET /api/og/{template} and /api/og/auto: query params, API keys, demo=1 watermarks, signed URLs, errors, Next.js snippets. Machine-readable /llms.txt for Cursor, ChatGPT & Claude.',
  pathname: '/docs',
})

const PARAM_ROWS: { name: string; required: string; desc: string }[] = [
  { name: 'key', required: 'Production', desc: 'API key (`ogk_live_…`); also accepted as `Authorization: Bearer`.' },
  { name: 'demo', required: 'Demo only', desc: 'Use `demo=1` without a key for watermarked evaluation images.' },
  { name: 'title', required: 'Yes', desc: 'Title text (1–300 chars). Required for the image to render.' },
  { name: 'subtitle', required: 'No', desc: 'Subheading (article, minimal, gradient).' },
  { name: 'author', required: 'No', desc: 'Author (article, quote).' },
  { name: 'image', required: 'No', desc: 'HTTPS URL to an image (article, product, podcast, event).' },
  { name: 'logo', required: 'No', desc: 'HTTPS URL (product, job, brand).' },
  { name: 'avatar', required: 'No', desc: 'HTTPS URL (quote).' },
  { name: 'price', required: 'No', desc: 'Price string (product).' },
  { name: 'date', required: 'No', desc: 'Date or time (event).' },
  { name: 'location', required: 'No', desc: 'Place (event, job).' },
  { name: 'company', required: 'No', desc: 'Company name (job).' },
  { name: 'episode', required: 'No', desc: 'Episode label (podcast).' },
  { name: 'show', required: 'No', desc: 'Show name (podcast).' },
  { name: 'tagline', required: 'No', desc: 'Tagline (brand).' },
  { name: 'code', required: 'No', desc: 'Code snippet (dark-code).' },
  { name: 'language', required: 'No', desc: 'e.g. ts, js (dark-code).' },
  { name: 'theme', required: 'No', desc: '`light`, `dark`, or `classic` for supported templates.' },
  { name: 'accent', required: 'No', desc: 'Accent color as `#RRGGBB` for supported templates.' },
  { name: 'bg', required: 'No', desc: 'Background color as `#RRGGBB` for supported templates.' },
  { name: 'font', required: 'No', desc: 'Font family name for supported templates.' },
  { name: 'pattern', required: 'No', desc: '`none`, `dots`, or `grid` for supported templates.' },
  { name: 'domain', required: 'Security', desc: 'Optional domain claim checked against the API key allowlist.' },
  { name: 'sig', required: 'Security', desc: 'HMAC-SHA256 signature when a key requires signed URLs.' },
]

const ERRORS: { code: string; when: string }[] = [
  { code: '404 unknown_template', when: 'Template id is not in the list below.' },
  { code: '401', when: 'Missing, invalid, or revoked API key.' },
  { code: '400 invalid_params', when: 'Zod validation failed; often empty `title` or invalid image URL.' },
  { code: '429', when: 'Monthly (or daily, on Scale) quota reached.' },
]

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-lg border bg-muted/40 p-4 text-xs leading-relaxed">
      <code className="font-mono">{children}</code>
    </pre>
  )
}

export default function ApiDocsPage() {
  const base = siteConfig.url
  const og = (t: string, qs: string) => `${base}${getApiUrl(`/api/og/${t}`)}?${qs}`
  const faq = [
    {
      question: 'What endpoint generates Open Graph images?',
      answer: `Use GET ${base}${getApiUrl('/api/og/{template}')} with an API key and URL-encoded query parameters.`,
    },
    {
      question: 'Can I try OGKit without an API key?',
      answer: `Yes. Add demo=1 for a watermarked evaluation image, for example ${base}${getApiUrl('/api/og/minimal')}?demo=1&title=Hello.`,
    },
    {
      question: 'Can OGKit generate from an existing page URL?',
      answer: `Yes. Use GET ${base}${getApiUrl('/api/og/auto')}?url=https://example.com&key=KEY to extract title, description, favicon, theme color, and image metadata.`,
    },
    {
      question: 'Can I use OGKit from Next.js metadata?',
      answer:
        'Yes. Build a full OGKit image URL on the server and pass it to metadata.openGraph.images and twitter.images.',
    },
    {
      question: 'Is OGKit a screenshot API?',
      answer:
        'No. OGKit generates designed Open Graph cards from template fields. Use screenshot APIs when you need to capture an existing webpage.',
    },
  ]
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  }
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: 'OGKit Open Graph image API reference',
    description:
      'HTTP reference for OGKit: templates, query parameters, authentication, errors, signed URLs, and Next.js metadata integration for 1200×630 Open Graph images.',
    url: absoluteSiteUrl('/docs'),
    datePublished: '2026-04-30',
    dateModified: '2026-04-30',
    author: { '@type': 'Organization', name: siteConfig.name, url: absoluteSiteUrl('') },
    publisher: { '@type': 'Organization', name: siteConfig.name, url: absoluteSiteUrl('') },
    mainEntityOfPage: absoluteSiteUrl('/docs'),
    proficiencyLevel: 'Beginner',
    about: 'Open Graph image API',
  }
  const breadcrumbLd = breadcrumbListJsonLd([{ name: 'API reference', path: '/docs' }])

  return (
    <div className="container max-w-3xl space-y-12 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <div>
        <p className="text-sm font-medium text-muted-foreground">Reference</p>
        <h1 className="mt-1 text-3xl font-bold">OG image API</h1>
        <p className="mt-2 text-muted-foreground">
          Renders a <strong>1200×630</strong> Open Graph (PNG) image. All templates use the same endpoint; only the template
          slug and query string change.
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          For a long-form SEO perspective on link previews, see the{' '}
          <Link className="text-primary underline" href={withBasePath('/blog/open-graph-images-seo-guide')}>
            Open Graph images guide
          </Link>
          .
        </p>
        <Button asChild className="mt-4" variant="outline" size="sm">
          <Link href={withBasePath('/playground')}>Open Playground</Link>
        </Button>
      </div>

      <section>
        <h2 className="text-xl font-semibold">Base URL</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Use your deployed app root (e.g. <code className="font-mono text-foreground">NEXT_PUBLIC_APP_URL</code>).
          If the app is mounted under a path, include it (see <code className="font-mono">basePath</code> /{' '}
          <code className="font-mono">NEXT_PUBLIC_BASE_PATH</code> in this project).
        </p>
        <p className="mt-2 text-sm">
          Example base: <code className="font-mono text-sm">{base}</code>
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">Authentication</h2>
        <p className="mt-2 text-sm text-muted-foreground">Choose one of for production usage:</p>
        <ul className="mt-2 list-inside list-disc text-sm text-muted-foreground">
          <li>Query: <code className="font-mono text-foreground">?key=ogk_live_…</code></li>
          <li>Header: <code className="font-mono text-foreground">Authorization: Bearer ogk_live_…</code></li>
        </ul>
        <p className="mt-2 text-sm text-muted-foreground">
          Create keys from the <Link className="underline" href={withBasePath('/dashboard/keys')}>dashboard</Link> after you sign in.
          For evaluation, add <code className="font-mono">demo=1</code> and omit the key. Demo images are watermarked.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">Endpoint</h2>
        <p className="mt-1 font-mono text-sm text-foreground">GET {getApiUrl('/api/og/') + '{template}'}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Replace <code className="font-mono">{'{template}'}</code> with one of the slugs in the table below. Query parameters
          follow (see search params, excluding <code className="font-mono">key</code> when you use a header for auth).
        </p>
        <div className="mt-3">
          <p className="text-xs text-muted-foreground">Minimal example (replace KEY and use your key):</p>
          <CodeBlock>{og('minimal', 'key=KEY&title=My+Page')}</CodeBlock>
        </div>
        <div className="mt-3">
          <p className="text-xs text-muted-foreground">No-key demo example:</p>
          <CodeBlock>{og('minimal', 'demo=1&title=My+Page&theme=dark&accent=%232563eb')}</CodeBlock>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold">Auto-generate from a URL</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Use <code className="font-mono">/api/og/auto</code> when you want OGKit to fetch a page, extract metadata, and
          choose an article or minimal card. You can still override fields with query parameters.
        </p>
        <CodeBlock>{`${base}${getApiUrl('/api/og/auto')}?key=KEY&url=https%3A%2F%2Fexample.com&template=article`}</CodeBlock>
      </section>

      <section>
        <h2 className="text-xl font-semibold">Templates</h2>
        <div className="mt-4 overflow-x-auto rounded-md border">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-2 font-medium">Slug</th>
                <th className="p-2 font-medium">Name</th>
                <th className="p-2 font-medium">Use case</th>
              </tr>
            </thead>
            <tbody>
              {TEMPLATE_IDS.map((id) => (
                <tr key={id} className="border-b last:border-0">
                  <td className="p-2 font-mono text-xs">{id}</td>
                  <td className="p-2">{TEMPLATE_META[id].title}</td>
                  <td className="p-2 text-muted-foreground">{TEMPLATE_META[id].description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold">Query parameters</h2>
        <p className="mt-2 text-sm text-muted-foreground">Empty values are dropped. All values should be URL-encoded.</p>
        <div className="mt-4 overflow-x-auto rounded-md border">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-2 font-medium">Name</th>
                <th className="p-2 font-medium">Required</th>
                <th className="p-2 font-medium">Description</th>
              </tr>
            </thead>
            <tbody>
              {PARAM_ROWS.map((r) => (
                <tr key={r.name} className="border-b last:border-0">
                  <td className="p-2 font-mono text-xs">{r.name}</td>
                  <td className="p-2">{r.required}</td>
                  <td className="p-2 text-muted-foreground">{r.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold">Errors (JSON body)</h2>
        <div className="mt-4 space-y-2 text-sm text-muted-foreground">
          {ERRORS.map((e) => (
            <p key={e.code}>
              <code className="font-mono text-foreground">{e.code}</code> — {e.when}
            </p>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold">Next.js — <code className="font-mono">opengraph-image</code> alternative</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Point <code className="font-mono">metadata.openGraph.images</code> at a fully qualified OGKit URL (or use{' '}
          <code className="font-mono">/api/og/…</code> on the same origin).
        </p>
        <CodeBlock>{`export const metadata = {
  title: { absolute: "My post — ${siteConfig.name}" },
  openGraph: {
    title: "My post",
    images: ["${og('article', 'key=KEY&title=My+post&author=ACME')}"]
  },
  twitter: {
    card: "summary_large_image",
    images: ["${og('article', 'key=KEY&title=My+post&author=ACME')}"]
  }
};`}</CodeBlock>
      </section>

      <section>
        <h2 className="text-xl font-semibold">Signed URLs and domain allowlists</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Paid keys can require signed URLs and domain claims from the dashboard. Sign the canonical path and sorted query
          string, excluding <code className="font-mono">sig</code>, with HMAC-SHA256 using the full API key as the secret.
        </p>
        <CodeBlock>{`// pseudo-code
const url = new URL("${base}${getApiUrl('/api/og/minimal')}?key=KEY&title=Hello&domain=example.com");
url.searchParams.sort();
const sig = hmacSha256(fullApiKey, url.pathname + "?" + url.searchParams.toString());
url.searchParams.set("sig", sig);`}</CodeBlock>
      </section>

      <section>
        <h2 className="text-xl font-semibold">Guides and comparisons</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ['Next.js OG image generator guide', '/for/nextjs'],
            ['Dynamic social preview images', '/use-case/dynamic-social-preview-images'],
            ['OGKit vs @vercel/og', '/compare/ogkit-vs-vercel-og'],
            ['OGKit vs Bannerbear', '/compare/ogkit-vs-bannerbear'],
            ['OGKit vs Placid', '/compare/ogkit-vs-placid'],
            ['OGKit vs MetaShot', '/compare/ogkit-vs-metashot'],
            ['OGKit vs OGMagic', '/compare/ogkit-vs-ogmagic'],
            ['OGKit vs screenshot APIs', '/compare/ogkit-vs-screenshot-apis'],
            ['llms.txt', '/llms.txt'],
          ].map(([label, href]) => (
            <Link key={href} href={withBasePath(href)} className="rounded-lg border p-4 text-sm font-medium hover:bg-muted/50">
              {label}
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold">Plain fetch</h2>
        <CodeBlock>{`const u = new URL("${base}${getApiUrl('/api/og/minimal')}");
u.searchParams.set("key", process.env.OGKIT_KEY!);
u.searchParams.set("title", "Hello");
const r = await fetch(u);
if (!r.ok) throw new Error(String(r.status));
const buf = await r.arrayBuffer();
// e.g. write to disk or return new Response(buf, { headers: { "Content-Type": "image/png" } })`}</CodeBlock>
      </section>

      <section>
        <h2 className="text-xl font-semibold">MCP server (Cursor &amp; AI agents)</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          OGKit exposes a remote Model Context Protocol server at{' '}
          <code className="font-mono text-foreground">{base}{getApiUrl('/api/mcp')}</code>. Connect it in Cursor via{' '}
          <code className="font-mono">.cursor/mcp.json</code> or install the plugin bundle from the repo (
          <code className="font-mono">ogkit/cursor-plugin</code>).
        </p>
        <CodeBlock>{`{
  "mcpServers": {
    "ogkit": {
      "url": "${base}${getApiUrl('/api/mcp')}"
    }
  }
}`}</CodeBlock>
        <p className="mt-3 text-sm text-muted-foreground">Tools: og_list_templates, og_build_url, og_preview, og_nextjs_snippet, og_validate_page, ogkit_get_started.</p>
        <p className="mt-3 text-sm text-muted-foreground">
          <strong className="font-medium text-foreground">Cursor Marketplace:</strong> submit plugin path{' '}
          <code className="font-mono">ogkit/cursor-plugin</code> at{' '}
          <a className="underline" href="https://cursor.com/marketplace/publish" target="_blank" rel="noopener noreferrer">
            cursor.com/marketplace/publish
          </a>
          . After sign-in, the{' '}
          <Link href={withBasePath('/onboarding')} className="font-medium text-foreground underline underline-offset-4">
            setup wizard
          </Link>{' '}
          copies <code className="font-mono">mcp.json</code> for you.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">LLM and crawler discovery</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          For coding agents and search systems that ingest plain-text site maps, use{' '}
          <Link href={withBasePath('/llms.txt')} className="font-medium text-foreground underline underline-offset-4">
            /llms.txt
          </Link>{' '}
          (same facts at{' '}
          <Link href={withBasePath('/llm.txt')} className="font-medium text-foreground underline underline-offset-4">
            /llm.txt
          </Link>
          ). It lists endpoints, templates, pricing summary, and deep links to comparisons and use cases.
        </p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Need live preview?</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Use the Playground to pick a template, fill fields, and copy the final URL.
          </p>
          <Button asChild className="mt-4" size="sm">
            <Link href={withBasePath('/playground')}>Go to Playground</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
