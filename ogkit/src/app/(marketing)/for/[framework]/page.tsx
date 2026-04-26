import { siteConfig } from '@/config/site'
import { notFound } from 'next/navigation'
import { FinishCta } from '@/components/marketing/finish-cta'

const HINT: Record<string, string> = {
  nextjs: 'In Next.js App Router, set `metadata.openGraph.images` to a full OGKit image URL. Generate the URL on the server, pass title and subtitle as query parameters, and keep your API key outside client components.',
  next: 'In the App Router, set `metadata.openGraph.images` to your full OGKit image URL, or add an `og:image` head tag that points to `/api/og/...` on your app host.',
  react: 'React apps can use OGKit from the server, framework metadata layer, or static generation step. Build a full HTTPS image URL and place it in `og:image` plus `twitter:image`.',
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
  return {
    title: `Dynamic Open Graph images for ${params.framework} — ${siteConfig.name}`,
    description: `Generate branded social preview images for ${params.framework} with the OGKit Open Graph image API.`,
  }
}

export default function ForFrameworkPage({ params }: Props) {
  if (!ALLOWED.has(params.framework)) notFound()
  const f = params.framework
  return (
    <div className="container max-w-3xl py-12">
      <h1 className="text-3xl font-bold">Dynamic Open Graph images for {f}</h1>
      <p className="mt-4 text-muted-foreground leading-relaxed">{HINT[f]!}</p>
      <p className="mt-3 text-sm text-muted-foreground">
        Every framework only needs a stable, absolute HTTPS `og:image`. OGKit gives you one URL, production templates,
        and query parameters for titles, images, logos, authors, products, events, jobs, and code snippets.
      </p>
      <FinishCta />
    </div>
  )
}
