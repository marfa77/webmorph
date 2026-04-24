import { siteConfig } from '@/config/site'
import { notFound } from 'next/navigation'
import { FinishCta } from '@/components/marketing/finish-cta'

const HINT: Record<string, string> = {
  next: 'In the App Router, set `metadata.openGraph.images` to your full OGKit image URL, or add an `og:image` head tag that points to `/api/og/...` on your app host.',
  nuxt: 'In Nuxt 3, set `ogImage` / `og:image` in `defineOgImage` or in `nuxt.config` by resolving the OGKit URL from runtime config.',
  svelte: 'Use a link tag or SvelteKit `handle` to emit `og:image` pointing to your generated OG URL.',
  astro: 'Use `<meta property="og:image" content={ogUrl} />` in your layout, where `ogUrl` comes from the OGKit request URL.',
  rails: 'In `app/views` or a helper, set `og:image` with `tag :meta, property: "og:image", content: ogkit_url` built from your API key and title.',
  django: 'Add an `og:image` `Meta` in your context or template with the HTTPS URL to your OG image endpoint.',
  laravel: 'In Blade, output `<meta property="og:image" content="{{ $ogImage }}">` where the URL is your signed OGKit URL for that page.',
  remix: 'Use a layout route or a loader to pass `og:image` into a `<meta>` export or a SEO component for each document.',
  hugo: 'Set `images` in front-matter, or a partial that builds a query string to your external OG service URL, including your API key in server-side only builds.',
}

const ALLOWED = new Set(Object.keys(HINT))

type Props = { params: { framework: string } }

export function generateMetadata({ params }: Props) {
  if (!ALLOWED.has(params.framework)) return {}
  return { title: `Open Graph for ${params.framework} — ${siteConfig.name}` }
}

export default function ForFrameworkPage({ params }: Props) {
  if (!ALLOWED.has(params.framework)) notFound()
  const f = params.framework
  return (
    <div className="container max-w-3xl py-12">
      <h1 className="text-3xl font-bold">Open Graph for {f}</h1>
      <p className="mt-4 text-muted-foreground leading-relaxed">{HINT[f]!}</p>
      <p className="mt-3 text-sm text-muted-foreground">
        Every framework only needs a stable, absolute HTTPS `og:image`—OGKit gives you a single image URL and query parameters
        (see the API).
      </p>
      <FinishCta />
    </div>
  )
}
