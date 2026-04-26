import Link from 'next/link'
import { siteConfig } from '@/config/site'
import { withBasePath } from '@/config/paths'
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
  if (params.framework === 'nextjs') {
    return {
      title: `Next.js OG image generator — ${siteConfig.name}`,
      description:
        'Generate dynamic Open Graph images for Next.js App Router metadata with the OGKit hosted OG image API.',
    }
  }
  return {
    title: `Dynamic Open Graph images for ${params.framework} — ${siteConfig.name}`,
    description: `Generate branded social preview images for ${params.framework} with the OGKit Open Graph image API.`,
  }
}

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-lg border bg-muted/40 p-4 text-xs leading-relaxed">
      <code className="font-mono">{children}</code>
    </pre>
  )
}

function NextJsGuide() {
  return (
    <div className="space-y-12">
      <section>
        <p className="text-sm font-medium text-muted-foreground">Next.js guide</p>
        <h1 className="mt-1 text-4xl font-bold tracking-tight">Next.js OG image generator</h1>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
          OGKit is for Next.js Open Graph images when you want a hosted generator instead of maintaining custom
          `opengraph-image.tsx` routes, Satori layouts, font loading, and render debugging yourself.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold">Use OGKit in App Router metadata</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Build the image URL on the server, then pass it to <code className="font-mono">metadata.openGraph.images</code>.
          Keep the API key in server-side env vars or generate URLs during build.
        </p>
        <div className="mt-4">
          <CodeBlock>{`const ogImage = new URL("https://webmorp.art/api/og/article");
ogImage.searchParams.set("key", process.env.OGKIT_KEY!);
ogImage.searchParams.set("title", "How we shipped faster");
ogImage.searchParams.set("author", "Acme");

export const metadata = {
  title: "How we shipped faster",
  openGraph: {
    images: [ogImage.toString()]
  },
  twitter: {
    card: "summary_large_image",
    images: [ogImage.toString()]
  }
};`}</CodeBlock>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          ['No image route to maintain', 'Use templates instead of owning Satori JSX, CSS constraints, and rendering edge cases.'],
          ['Metadata-ready URLs', 'Every image is a normal HTTPS URL that works in Open Graph, Twitter cards, Slack, Discord, and iMessage.'],
          ['Good fit for launches', 'Generate cards for docs, changelogs, blogs, SaaS landing pages, and product launch pages.'],
        ].map(([title, copy]) => (
          <div key={title} className="rounded-lg border p-5">
            <h2 className="font-semibold">{title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{copy}</p>
          </div>
        ))}
      </section>

      <section>
        <h2 className="text-2xl font-semibold">Related Next.js SEO pages</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            ['OGKit vs Vercel OG', '/compare/ogkit-vs-vercel-og'],
            ['Open Graph image API docs', '/docs'],
            ['Try the Playground', '/playground'],
          ].map(([label, href]) => (
            <Link key={href} href={withBasePath(href)} className="rounded-lg border p-4 text-sm font-medium hover:bg-muted/50">
              {label}
            </Link>
          ))}
        </div>
      </section>

      <FinishCta />
    </div>
  )
}

export default function ForFrameworkPage({ params }: Props) {
  if (!ALLOWED.has(params.framework)) notFound()
  if (params.framework === 'nextjs') {
    return (
      <div className="container max-w-4xl py-12">
        <NextJsGuide />
      </div>
    )
  }
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
