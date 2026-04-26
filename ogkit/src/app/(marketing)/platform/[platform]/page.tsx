import { siteConfig } from '@/config/site'
import { notFound } from 'next/navigation'
import { FinishCta } from '@/components/marketing/finish-cta'

const COPY: Record<string, string> = {
  vercel:
    'Host this Next.js app on Vercel, set your `NEXT_PUBLIC_APP_URL` to the deployment origin, and point `og:image` to the same project’s `/api/og/...` route. Edge and Node runtimes are supported; the OG route runs on Node for key verification.',
  netlify:
    'Deploy the app to Netlify, set public URL env vars, and use the generated OG image URL in your page metadata. Keep your API key server-side or in a serverless function that builds the image URL.',
  cloudflare:
    'If you use Cloudflare in front of the app, cache `GET /api/og/...` at the edge as suitable; the response includes cache headers. Do not expose your key in public HTML—build the URL in your origin when possible.',
  'self-hosted':
    'Run the app behind your own reverse proxy. Expose one public HTTPS host for the API, store `API_KEY_SALT` and Supabase keys in env, and use the same `/api/og/{template}` pattern as in the docs.',
}

const DETAILS: Record<string, { env: string[]; checklist: string[]; cache: string }> = {
  vercel: {
    env: ['NEXT_PUBLIC_APP_URL=https://webmorp.art', 'OGKIT_KEY=ogk_live_...', 'API_KEY_SALT=...'],
    checklist: ['Use the final production domain in public URL env vars.', 'Keep API keys server-side.', 'Let Vercel cache generated PNG responses.'],
    cache: 'OGKit image responses include cache headers for CDN reuse. Keep image URLs deterministic so repeated shares hit cache instead of re-rendering.',
  },
  netlify: {
    env: ['NEXT_PUBLIC_APP_URL=https://example.com', 'OGKIT_KEY=ogk_live_...', 'API_KEY_SALT=...'],
    checklist: ['Set the deployed HTTPS origin explicitly.', 'Generate image URLs in server functions or build steps.', 'Avoid exposing API keys in static HTML.'],
    cache: 'Use Netlify edge/CDN behavior for static pages and keep OGKit image URLs stable. Changing query parameters should be the cache-busting mechanism.',
  },
  cloudflare: {
    env: ['NEXT_PUBLIC_APP_URL=https://example.com', 'OGKIT_KEY=ogk_live_...', 'API_KEY_SALT=...'],
    checklist: ['Cache public OG image GET requests at the edge.', 'Bypass cache for dashboard and account pages.', 'Use signed URLs for public generation controls.'],
    cache: 'Cloudflare can cache generated images aggressively because the query string defines the image. Do not cache authenticated dashboard routes.',
  },
  'self-hosted': {
    env: ['NEXT_PUBLIC_APP_URL=https://example.com', 'OGKIT_KEY=ogk_live_...', 'API_KEY_SALT=...'],
    checklist: ['Serve one canonical HTTPS host.', 'Redirect http and www variants in one hop.', 'Put a CDN in front of generated image routes if traffic grows.'],
    cache: 'Self-hosted deployments should preserve OGKit cache headers and avoid proxy rules that strip query strings from image requests.',
  },
}

const ALLOWED = new Set(Object.keys(COPY))
type Props = { params: { platform: string } }

export function generateMetadata({ params }: Props) {
  if (!ALLOWED.has(params.platform)) return {}
  return {
    title: `Open Graph image API on ${params.platform} — ${siteConfig.name}`,
    description: `Deploy OGKit on ${params.platform} and generate dynamic social preview images from one URL.`,
  }
}

export default function PlatformPage({ params }: Props) {
  if (!ALLOWED.has(params.platform)) notFound()
  const p = params.platform
  const details = DETAILS[p]!
  return (
    <div className="container max-w-4xl space-y-12 py-12">
      <section>
        <p className="text-sm font-medium text-muted-foreground">Deployment guide</p>
        <h1 className="mt-1 text-4xl font-bold tracking-tight capitalize">Open Graph image API on {p.replace('-', ' ')}</h1>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{COPY[p]!}</p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Use this guide when evaluating OGKit as a hosted Vercel OG alternative, screenshot-service alternative, or
          framework-neutral social preview image API. The important SEO rule is that canonical URLs, sitemap URLs, and
          generated image URLs should all use the same final HTTPS host.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border p-5">
          <h2 className="text-xl font-semibold">Environment checklist</h2>
          <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-muted-foreground">
            {details.env.map((item) => (
              <li key={item}>
                <code className="font-mono">{item}</code>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg border p-5">
          <h2 className="text-xl font-semibold">Production checklist</h2>
          <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-muted-foreground">
            {details.checklist.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold">Caching and crawlability</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{details.cache}</p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          For SEO crawlers, avoid bot challenges on public pages, <code className="font-mono">robots.txt</code>, and{' '}
          <code className="font-mono">sitemap.xml</code>. If a crawler sees a challenge page or a redirect chain, it may mark
          otherwise valid pages as non-indexable.
        </p>
      </section>

      <FinishCta />
    </div>
  )
}
