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

const DETAILS: Record<string, { label: string; example: string; checklist: string[]; pitfalls: string[] }> = {
  nextjs: {
    label: 'Next.js App Router',
    example: `export async function generateMetadata() {
  const image = new URL("https://webmorp.art/api/og/article");
  image.searchParams.set("key", process.env.OGKIT_KEY!);
  image.searchParams.set("title", "My Next.js post");
  return { openGraph: { images: [image.toString()] } };
}`,
    checklist: ['Build URLs in Server Components or metadata functions.', 'Keep OGKIT_KEY out of client components.', 'Use absolute HTTPS URLs.'],
    pitfalls: ['Using relative og:image URLs in production', 'Putting secrets in bundled JavaScript', 'Maintaining Satori routes when templates are enough'],
  },
  react: {
    label: 'React',
    example: `<meta property="og:image" content="https://webmorp.art/api/og/minimal?key=KEY&title=React+Launch" />`,
    checklist: ['Set metadata from your hosting framework, CMS, or SSR layer.', 'Generate the URL before HTML is served.', 'Use one image per important route.'],
    pitfalls: ['Trying to update OG tags after hydration', 'Expecting crawlers to run client-side React', 'Using one generic image for every route'],
  },
  remix: {
    label: 'Remix',
    example: `export const meta = () => {
  const image = new URL("https://webmorp.art/api/og/article");
  image.searchParams.set("key", process.env.OGKIT_KEY!);
  image.searchParams.set("title", "Remix guide");
  return [{ property: "og:image", content: image.toString() }];
};`,
    checklist: ['Build the image in loader/meta code.', 'Share the same URL in Twitter metadata.', 'Avoid client-only metadata updates.'],
    pitfalls: ['Missing twitter:image', 'Leaking keys to browser code', 'Not URL-encoding dynamic route data'],
  },
  astro: {
    label: 'Astro',
    example: `---
const image = new URL("https://webmorp.art/api/og/minimal");
image.searchParams.set("key", import.meta.env.OGKIT_KEY);
image.searchParams.set("title", Astro.props.title);
---
<meta property="og:image" content={image.toString()} />`,
    checklist: ['Build URLs in layouts or content collections.', 'Use environment variables during SSR/build.', 'Set image width and height metadata.'],
    pitfalls: ['Hardcoding one preview for all markdown pages', 'Forgetting collection-specific titles', 'Using local-only URLs in production'],
  },
  nuxt: {
    label: 'Nuxt',
    example: `const image = new URL("https://webmorp.art/api/og/minimal")
image.searchParams.set("key", useRuntimeConfig().ogkitKey)
image.searchParams.set("title", page.title)
useSeoMeta({ ogImage: image.toString(), twitterImage: image.toString() })`,
    checklist: ['Use runtime config for secrets.', 'Set ogImage and twitterImage together.', 'Build URLs before crawler HTML is returned.'],
    pitfalls: ['Using public runtime config for secret keys', 'Relying on client-only composables', 'Skipping per-page titles'],
  },
  svelte: {
    label: 'SvelteKit',
    example: `<svelte:head>
  <meta property="og:image" content={ogImageUrl} />
  <meta name="twitter:image" content={ogImageUrl} />
</svelte:head>`,
    checklist: ['Create ogImageUrl in load or server code.', 'Pass final URLs into head tags.', 'Use absolute production origins.'],
    pitfalls: ['Computing metadata only in the browser', 'Missing canonical titles', 'Sharing one card across all routes'],
  },
  rails: {
    label: 'Rails',
    example: `<meta property="og:image" content="<%= ogkit_image_url(title: @post.title) %>">`,
    checklist: ['Build a helper for OGKit URLs.', 'Keep keys in Rails credentials or ENV.', 'Escape and encode dynamic values.'],
    pitfalls: ['Rendering unencoded query strings', 'Putting keys into frontend packs', 'Forgetting background jobs are unnecessary for simple cards'],
  },
  django: {
    label: 'Django',
    example: `<meta property="og:image" content="{{ og_image_url }}">
<meta name="twitter:image" content="{{ og_image_url }}">`,
    checklist: ['Build og_image_url in the view/context.', 'Store keys in environment variables.', 'Use urllib.parse for query strings.'],
    pitfalls: ['Concatenating URLs by hand', 'Not passing page-specific descriptions', 'Using private media URLs as card images'],
  },
  laravel: {
    label: 'Laravel',
    example: `<meta property="og:image" content="{{ $ogImage }}">
<meta name="twitter:image" content="{{ $ogImage }}">`,
    checklist: ['Build URLs in controllers or view models.', 'Store keys in env/config.', 'Use signed URLs for public pages when needed.'],
    pitfalls: ['Leaking env values into compiled assets', 'Skipping URL encoding', 'Using one preview for all Blade templates'],
  },
  hugo: {
    label: 'Hugo',
    example: `<meta property="og:image" content="{{ .Params.og_image }}">
<meta name="twitter:image" content="{{ .Params.og_image }}">`,
    checklist: ['Generate OGKit URLs during static builds.', 'Use front matter titles and descriptions.', 'Avoid exposing keys in public source repos.'],
    pitfalls: ['Committing production keys to config files', 'Forgetting taxonomy pages', 'Using relative URLs in generated HTML'],
  },
}

const ALLOWED = new Set(Object.keys(HINT))

type Props = { params: { framework: string } }

function pageOgImage(title: string, subtitle = 'Framework guide') {
  const url = new URL(`${siteConfig.url}/api/og/minimal`)
  url.searchParams.set('demo', '1')
  url.searchParams.set('title', title)
  url.searchParams.set('subtitle', subtitle)
  url.searchParams.set('accent', '#2563eb')
  return url.toString()
}

export function generateMetadata({ params }: Props) {
  if (!ALLOWED.has(params.framework)) return {}
  const details = DETAILS[params.framework]!
  const title = params.framework === 'nextjs' ? `Next.js OG image generator — ${siteConfig.name}` : `Dynamic Open Graph images for ${details.label} — ${siteConfig.name}`
  const description =
    params.framework === 'nextjs'
      ? 'Generate dynamic Open Graph images for Next.js App Router metadata with OGKit, code examples, pitfalls, and hosted API guidance.'
      : `Generate branded Open Graph images for ${details.label} with OGKit. Includes implementation examples, metadata checklist, and common pitfalls.`
  const image = pageOgImage(title.replace(` — ${siteConfig.name}`, ''), 'Open Graph image API guide')
  const canonical = `${siteConfig.url}/for/${params.framework}`
  if (params.framework === 'nextjs') {
    return {
      title,
      description,
      alternates: { canonical },
      openGraph: { title, description, url: canonical, images: [image] },
      twitter: { card: 'summary_large_image', title, description, images: [image] },
    }
  }
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, images: [image] },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
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

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border p-5">
          <h2 className="text-xl font-semibold">Why not always build a custom route?</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Custom <code className="font-mono">opengraph-image.tsx</code> routes are great when every pixel needs bespoke
            layout control. They also make you own font loading, JSX-to-image constraints, render failures, and template QA.
            OGKit is the simpler path when the page needs a reliable social card, not a custom image renderer.
          </p>
        </div>
        <div className="rounded-lg border p-5">
          <h2 className="text-xl font-semibold">Production checklist</h2>
          <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-muted-foreground">
            {DETAILS.nextjs!.checklist.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
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

      <section>
        <h2 className="text-2xl font-semibold">Frequently asked questions</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {DETAILS.nextjs &&
            [
              {
                question: 'How do I add dynamic Open Graph images to Next.js App Router?',
                answer: 'Build an absolute OGKit image URL inside generateMetadata or server-side code, then assign it to metadata.openGraph.images and twitter.images.',
              },
              {
                question: 'Can OGKit replace a custom opengraph-image.tsx route?',
                answer: 'Yes, when you want hosted templates and stable image URLs instead of maintaining a custom Satori route, font loading, and renderer debugging.',
              },
              {
                question: 'Where should I keep the OGKit API key?',
                answer: 'Keep the API key in server-side environment variables. Do not expose it in client components or public JavaScript bundles.',
              },
            ].map((item) => (
              <div key={item.question} className="rounded-lg border p-4">
                <h3 className="font-semibold">{item.question}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.answer}</p>
              </div>
            ))}
        </div>
      </section>

      <FinishCta />
    </div>
  )
}

export default function ForFrameworkPage({ params }: Props) {
  if (!ALLOWED.has(params.framework)) notFound()
  const details = DETAILS[params.framework]!
  const faq = [
    {
      question: `How do I add dynamic Open Graph images to ${details.label}?`,
      answer: `Build an absolute OGKit image URL on the server or during static generation, then place it in og:image and twitter:image metadata for each important page.`,
    },
    {
      question: `Can I use OGKit with ${details.label} without a custom image route?`,
      answer: 'Yes. OGKit returns a normal 1200x630 PNG URL from template and query parameters, so you do not need to maintain a Satori, Puppeteer, or screenshot pipeline.',
    },
    {
      question: 'Where should I keep the OGKit API key?',
      answer: 'Keep the API key in server-side environment variables, framework runtime config, or build-time secrets. Do not bundle it into client-side JavaScript.',
    },
  ]
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faq.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: { '@type': 'Answer', text: item.answer },
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      headline: `Dynamic Open Graph images for ${details.label}`,
      description: HINT[params.framework],
      author: { '@type': 'Organization', name: siteConfig.name },
      publisher: { '@type': 'Organization', name: siteConfig.name },
      mainEntityOfPage: `${siteConfig.url}/for/${params.framework}`,
    },
  ]
  if (params.framework === 'nextjs') {
    return (
      <div className="container max-w-4xl py-12">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <NextJsGuide />
      </div>
    )
  }
  const f = params.framework
  return (
    <div className="container max-w-4xl space-y-12 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section>
        <p className="text-sm font-medium text-muted-foreground">Framework guide</p>
        <h1 className="mt-1 text-4xl font-bold tracking-tight">Dynamic Open Graph images for {details.label}</h1>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{HINT[f]!}</p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Every framework only needs a stable, absolute HTTPS <code className="font-mono">og:image</code>. OGKit gives you one
          URL, production templates, and query parameters for titles, images, logos, authors, products, events, jobs, and code
          snippets.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold">Implementation pattern</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Generate the OGKit URL before the crawler sees the HTML. That can happen during static generation, in a server
          route, or in the framework metadata layer.
        </p>
        <div className="mt-4">
          <CodeBlock>{details.example}</CodeBlock>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border p-5">
          <h2 className="text-xl font-semibold">Checklist</h2>
          <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-muted-foreground">
            {details.checklist.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg border p-5">
          <h2 className="text-xl font-semibold">Common pitfalls</h2>
          <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-muted-foreground">
            {details.pitfalls.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold">When a hosted OG API makes sense</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          A hosted Open Graph image API is useful when you need consistent cards across many pages but do not want to maintain
          a custom renderer in every app. It is especially useful for docs, changelogs, launch pages, public customer pages,
          and content collections where the title and summary change often.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold">Frequently asked questions</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {faq.map((item) => (
            <div key={item.question} className="rounded-lg border p-4">
              <h3 className="font-semibold">{item.question}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.answer}</p>
            </div>
          ))}
        </div>
      </section>

      <FinishCta />
    </div>
  )
}
