import Link from 'next/link'
import { siteConfig } from '@/config/site'
import { absoluteSiteUrl, withBasePath } from '@/config/paths'
import { notFound } from 'next/navigation'
import { FinishCta } from '@/components/marketing/finish-cta'
import { dogfoodOgImageUrl, ogImageWithAlt } from '@/lib/dogfood-og'
import { clipMetaDescription } from '@/lib/seo-meta'

const HINT: Record<string, string> = {
  nextjs:
    'In Next.js App Router, build absolute OGKit URLs in generateMetadata from route data, set openGraph.images + twitter.images, keep OGKIT_KEY server-side, then rescrape after deploys when titles change.',
  react: 'React apps can use OGKit from the server, framework metadata layer, or static generation step. Build a full HTTPS image URL and place it in `og:image` plus `twitter:image`.',
  nuxt: 'In Nuxt 3, set `ogImage` / `og:image` in `defineOgImage` or in `nuxt.config` by resolving the OGKit URL from runtime config.',
  svelte: 'Use a link tag or SvelteKit `handle` to emit `og:image` pointing to your generated OG URL.',
  astro:
    'Bake per-entry OGKit URLs in Astro layouts or content collections at build time (private OGKIT_KEY, never PUBLIC_). After title changes: rebuild, deploy, rescrape.',
  rails: 'In `app/views` or a helper, set `og:image` with `tag :meta, property: "og:image", content: ogkit_url` built from your API key and title.',
  django: 'Add an `og:image` `Meta` in your context or template with the HTTPS URL to your OG image endpoint.',
  laravel: 'In Blade, output `<meta property="og:image" content="{{ $ogImage }}">` where the URL is your signed OGKit URL for that page.',
  remix: 'Use a layout route or a loader to pass `og:image` into a `<meta>` export or a SEO component for each document.',
  hugo:
    'Bake absolute OGKit cards in a Hugo partial with querify + getenv("OGKIT_KEY") at build time. Cover posts and taxonomies; rebuild + rescrape after renames.',
}

type FrameworkDetails = {
  label: string
  example: string
  checklist: string[]
  pitfalls: string[]
  deepSections?: { heading: string; body: string; code?: string }[]
  workedSteps?: string[]
}

const DETAILS: Record<string, FrameworkDetails> = {
  nextjs: {
    label: 'Next.js App Router',
    example: `export async function generateMetadata({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug);
  const image = new URL("${siteConfig.url}/api/og/article");
  image.searchParams.set("key", process.env.OGKIT_KEY!);
  image.searchParams.set("title", post.title);
  image.searchParams.set("subtitle", post.excerpt);
  const url = image.toString();
  return {
    openGraph: { images: [{ url, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", images: [url] },
  };
}`,
    checklist: [
      'Build URLs in generateMetadata / Server Components only.',
      'Keep OGKIT_KEY out of client components and NEXT_PUBLIC_*.',
      'Use absolute HTTPS URLs with width/height when possible.',
      'Mirror the same URL in openGraph.images and twitter.images.',
      'After title changes, update the OGKit query (or v=) and rescrape.',
    ],
    pitfalls: [
      'Relative og:image paths (scrapers resolve against the wrong host)',
      'Putting OGKIT_KEY in NEXT_PUBLIC_ or client bundles',
      'Static metadata export that never updates per slug',
      'Shipping opengraph-image.tsx and OGKit URL for the same route (last write wins / confusion)',
      'Expecting Slack/Facebook to drop cache without a new image URL',
    ],
  },
  react: {
    label: 'React',
    example: `// Prefer your host's SSR/SSG metadata — not a client effect
const og = new URL("${siteConfig.url}/api/og/minimal");
og.searchParams.set("key", process.env.OGKIT_KEY);
og.searchParams.set("title", pageTitle);
// Emit in the document head from Remix/Next/Astro/etc:
// <meta property="og:image" content={og.toString()} />`,
    checklist: [
      'Set metadata from your hosting framework, CMS, or SSR layer — not useEffect.',
      'Generate the URL before HTML is served to crawlers.',
      'Use one image per important route; mirror twitter:image.',
      'Keep OGKIT_KEY in server env only.',
    ],
    pitfalls: [
      'Trying to update OG tags after hydration',
      'Expecting crawlers to run client-side React',
      'Using one generic image for every route',
      'Shipping the API key in Create React App / Vite public env',
    ],
    deepSections: [
      {
        heading: 'React alone does not own <head>',
        body: 'A client-only React SPA cannot reliably set Open Graph tags for Slack or LinkedIn. Pair React with Next.js, Remix, Astro islands, or a server that renders meta tags into the first HTML response. OGKit then becomes a plain HTTPS URL you inject from that server.',
      },
      {
        heading: 'Vite / CRA production pattern',
        body: 'If you must stay on a static host, generate OGKit URLs at build time for each content entry (CMS export or markdown) and write them into prerendered HTML or a meta plugin. Do not call the OG API from the browser with a production key.',
      },
    ],
    workedSteps: [
      'Choose the server or SSG layer that emits HTML.',
      'Build an OGKit URL with title/subtitle for that route.',
      'Set og:image and twitter:image to the same absolute URL.',
      'Validate with /tools debuggers after deploy.',
    ],
  },
  remix: {
    label: 'Remix',
    example: `export const meta: MetaFunction = ({ data }) => {
  const image = new URL("${siteConfig.url}/api/og/article");
  image.searchParams.set("key", process.env.OGKIT_KEY!);
  image.searchParams.set("title", data.post.title);
  image.searchParams.set("subtitle", data.post.summary);
  const url = image.toString();
  return [
    { property: "og:image", content: url },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:image", content: url },
  ];
};`,
    checklist: [
      'Build the image in loader/meta code from route data.',
      'Share the same URL in Twitter metadata.',
      'Avoid client-only metadata updates.',
      'URL-encode dynamic titles from loaders.',
    ],
    pitfalls: ['Missing twitter:image', 'Leaking keys to browser code', 'Not URL-encoding dynamic route data', 'Using relative image URLs in nested routes'],
    deepSections: [
      {
        heading: 'Loaders own the truth',
        body: 'Derive card fields from the same loader data you render on the page so Slack titles match the H1. If a nested route overrides meta, ensure parent layouts do not clobber og:image with a homepage default.',
      },
      {
        heading: 'Edge vs Node',
        body: 'Remix can run on many adapters. OGKit does not need Edge ImageResponse — only a place to build a string URL. That keeps adapters interchangeable.',
      },
    ],
    workedSteps: [
      'Read title/summary in the route loader.',
      'Build OGKit URL in meta() with process.env.OGKIT_KEY.',
      'Return og:image + twitter:image.',
      'Rescrape after content edits (see caching guide).',
    ],
  },
  astro: {
    label: 'Astro',
    example: `---
// src/layouts/BlogPost.astro — static-friendly: URL baked at build
const { title, description } = Astro.props;
const image = new URL("${siteConfig.url}/api/og/article");
image.searchParams.set("key", import.meta.env.OGKIT_KEY);
image.searchParams.set("title", title);
if (description) image.searchParams.set("subtitle", description);
const og = image.toString();
---
<meta property="og:image" content={og} />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:image" content={og} />`,
    checklist: [
      'Build URLs in layouts or content collections at build time (SSG).',
      'Store OGKIT_KEY as a private env (never PUBLIC_).',
      'Set og:image width/height (1200×630).',
      'Per-entry titles from collection frontmatter — not one site logo.',
      'After rebuilds that change titles, rescrape Facebook/LinkedIn.',
    ],
    pitfalls: [
      'Hardcoding one preview for all markdown pages',
      'Using import.meta.env.PUBLIC_OGKIT_KEY (leaks to the browser)',
      'Relative /og.png paths in production HTML',
      'Building locally without OGKIT_KEY → empty key= in committed HTML',
      'Expecting crawlers to see client-only meta from React islands',
    ],
    deepSections: [
      {
        heading: 'Content collections (unique per slug)',
        body: 'Map each collection entry to an OGKit URL from entry.data.title. On static output, every article ships a unique absolute card URL with zero runtime cost — scrapers never need your Astro server.',
        code: `---
import { getCollection } from "astro:content";
// pages/blog/[...slug].astro
const { entry } = Astro.props;
const og = new URL("${siteConfig.url}/api/og/article");
og.searchParams.set("key", import.meta.env.OGKIT_KEY);
og.searchParams.set("title", entry.data.title);
og.searchParams.set("subtitle", entry.data.description ?? "Blog");
---
<meta property="og:image" content={og.toString()} />
<meta name="twitter:image" content={og.toString()} />`,
      },
      {
        heading: 'astro.config env (private only)',
        body: 'Put the key in the server/build environment. Do not prefix with PUBLIC_. In CI, inject OGKIT_KEY as a secret before npm run build so static HTML contains a real key query param.',
        code: `# .env (local) / GitHub Actions secret (CI)
OGKIT_KEY=ogk_live_...
# Never: PUBLIC_OGKIT_KEY=...`,
      },
      {
        heading: 'Static site rescrape',
        body: 'Astro SSG freezes og:image into HTML at build. Changing a title requires a rebuild and deploy, then a platform rescrape. Prefer updating the OGKit title/subtitle query (new URL) over hoping Slack drops the old PNG. See Troubleshooting and Caching & rescrape.',
      },
      {
        heading: 'MDX / docs layouts',
        body: 'Put meta tags in the layout that wraps MDX so docs and blog share one pattern. Pass frontmatter into the props used for the query string — do not set a homepage card inside a nested docs layout.',
      },
    ],
    workedSteps: [
      'Add OGKIT_KEY to Astro env (non-PUBLIC) and CI secrets.',
      'Build the URL in the blog/docs layout from frontmatter.',
      'Emit og:image + twitter:image (+ width/height).',
      'Inspect dist/**/*.html for absolute https://…/api/og/… URLs.',
      'Deploy, then Facebook Debugger → Scrape Again on 1–2 posts.',
    ],
  },
  nuxt: {
    label: 'Nuxt',
    example: `const config = useRuntimeConfig()
const image = new URL("${siteConfig.url}/api/og/minimal")
image.searchParams.set("key", config.ogkitKey)
image.searchParams.set("title", page.value.title)
useSeoMeta({
  ogImage: image.toString(),
  twitterCard: "summary_large_image",
  twitterImage: image.toString(),
})`,
    checklist: [
      'Store the key in private runtimeConfig, not public.',
      'Set ogImage and twitterImage together.',
      'Build URLs before crawler HTML is returned.',
      'Use route-specific titles from page data.',
    ],
    pitfalls: [
      'Using public runtime config for secret keys',
      'Relying on client-only composables',
      'Skipping per-page titles',
      'Forgetting SSR on routes that need previews',
    ],
    deepSections: [
      {
        heading: 'runtimeConfig split',
        body: 'Put ogkitKey under runtimeConfig (server-only). Never runtimeConfig.public. Agents reading your nuxt.config should see the key only in server context.',
      },
      {
        heading: 'useSeoMeta timing',
        body: 'Call useSeoMeta in setup on pages that are server-rendered. For hybrid apps, mark share-critical routes with SSR so the first byte includes tags.',
      },
    ],
    workedSteps: [
      'Add ogkitKey to runtimeConfig.',
      'Build OGKit URL from page title.',
      'useSeoMeta for og + twitter.',
      'Validate with Facebook Sharing Debugger.',
    ],
  },
  svelte: {
    label: 'SvelteKit',
    example: `// +page.server.ts
import type { PageServerLoad } from './$types';
export const load: PageServerLoad = async ({ params }) => {
  const title = "Ship notes"; // from CMS/db
  const image = new URL("${siteConfig.url}/api/og/article");
  image.searchParams.set("key", process.env.OGKIT_KEY!);
  image.searchParams.set("title", title);
  return { title, ogImageUrl: image.toString() };
};

// +page.svelte
<svelte:head>
  <meta property="og:image" content={data.ogImageUrl} />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:image" content={data.ogImageUrl} />
</svelte:head>`,
    checklist: [
      'Create ogImageUrl in +page.server.ts / +layout.server.ts.',
      'Pass final URLs into <svelte:head>.',
      'Use absolute production origins.',
      'Keep OGKIT_KEY in private env ($env/static/private).',
    ],
    pitfalls: [
      'Computing metadata only in the browser',
      'Missing canonical titles',
      'Sharing one card across all routes',
      'Importing secrets into client modules',
    ],
    deepSections: [
      {
        heading: 'Server load is mandatory',
        body: 'SvelteKit crawlers see prerendered or SSR HTML. Build the OGKit URL in server load functions and pass a string into the page. Client-only stores will not fix Slack previews.',
      },
      {
        heading: 'Prerendered blogs',
        body: 'For prerender: true routes, the URL is baked at build time — perfect for changelogs and docs. Re-build when titles change, or switch those routes to SSR.',
      },
    ],
    workedSteps: [
      'Load title in +page.server.ts.',
      'Build OGKit URL with private env key.',
      'Emit tags in svelte:head.',
      'curl the HTML and confirm absolute og:image.',
    ],
  },
  rails: {
    label: 'Rails',
    example: `# app/helpers/ogkit_helper.rb
module OgkitHelper
  def ogkit_image_url(title:, subtitle: nil, template: "article")
    uri = URI("${siteConfig.url}/api/og/#{template}")
    params = { key: ENV.fetch("OGKIT_KEY"), title: title }
    params[:subtitle] = subtitle if subtitle.present?
    uri.query = URI.encode_www_form(params)
    uri.to_s
  end
end

# app/views/layouts/application.html.erb
<meta property="og:image" content="<%= ogkit_image_url(title: @post.title, subtitle: @post.excerpt) %>">
<meta name="twitter:image" content="<%= ogkit_image_url(title: @post.title, subtitle: @post.excerpt) %>">`,
    checklist: [
      'Build a helper for OGKit URLs.',
      'Keep keys in Rails credentials or ENV.',
      'Escape and encode dynamic values via URI.encode_www_form.',
      'Set both og:image and twitter:image.',
    ],
    pitfalls: [
      'Rendering unencoded query strings',
      'Putting keys into frontend packs',
      'Forgetting background jobs are unnecessary for simple cards',
      'Using relative asset paths as og:image',
    ],
    deepSections: [
      {
        heading: 'Helpers over string concat',
        body: 'Centralize URL building in a helper or presenter so every mailer preview and blog layout stays consistent. Add optional template: "product" for commerce pages.',
      },
      {
        heading: 'Credentials',
        body: 'Store OGKIT_KEY in Rails credentials or the host ENV. Never commit it to config/credentials.yml.enc plaintext in git discussions — rotate if leaked.',
      },
    ],
    workedSteps: [
      'Add OGKIT_KEY to ENV/credentials.',
      'Ship OgkitHelper.',
      'Call it from the layout with @post fields.',
      'Test with opengraph.xyz after deploy.',
    ],
  },
  django: {
    label: 'Django',
    example: `# views.py / context processor
from urllib.parse import urlencode
from django.conf import settings

def ogkit_image(title: str, subtitle: str | None = None) -> str:
    q = {"key": settings.OGKIT_KEY, "title": title}
    if subtitle:
        q["subtitle"] = subtitle
    return f"${siteConfig.url}/api/og/article?{urlencode(q)}"

# template
<meta property="og:image" content="{{ og_image_url }}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="{{ og_image_url }}">`,
    checklist: [
      'Build og_image_url in the view/context with urllib.parse.urlencode.',
      'Store keys in environment variables / settings.',
      'Pass page-specific titles and descriptions.',
      'Mirror twitter:image.',
    ],
    pitfalls: [
      'Concatenating URLs by hand',
      'Not passing page-specific descriptions',
      'Using private media URLs as card images',
      'Exposing settings.OGKIT_KEY to the template context unnecessarily',
    ],
    deepSections: [
      {
        heading: 'Context processors',
        body: 'For site-wide defaults, a context processor can expose a homepage card — but override per view for blog detail templates so each slug gets a unique title.',
      },
      {
        heading: 'Wagtail / CMS',
        body: 'Map CMS title and search_description fields into OGKit query params in the page serve method so editors do not touch raw URLs.',
      },
    ],
    workedSteps: [
      'Add OGKIT_KEY to Django settings from env.',
      'Helper with urlencode.',
      'Pass og_image_url into templates.',
      'Verify with LinkedIn Post Inspector.',
    ],
  },
  laravel: {
    label: 'Laravel',
    example: `// app/Support/Ogkit.php
namespace App\\Support;
class Ogkit {
  public static function image(string $title, ?string $subtitle = null, string $template = 'article'): string {
    $query = http_build_query(array_filter([
      'key' => config('services.ogkit.key'),
      'title' => $title,
      'subtitle' => $subtitle,
    ]));
    return '${siteConfig.url}/api/og/' . $template . '?' . $query;
  }
}

{{-- layout --}}
<meta property="og:image" content="{{ $ogImage }}">
<meta name="twitter:image" content="{{ $ogImage }}">`,
    checklist: [
      'Build URLs in controllers, view models, or a small support class.',
      'Store keys in config/services.php from env.',
      'Use http_build_query for encoding.',
      'Use signed URLs for public pages when keys are embedded in HTML.',
    ],
    pitfalls: [
      'Leaking env values into compiled assets',
      'Skipping URL encoding',
      'Using one preview for all Blade templates',
      'Putting the key in MIX_/VITE_ public env',
    ],
    deepSections: [
      {
        heading: 'Blade + Inertia',
        body: 'For Blade, set $ogImage in the controller. For Inertia, put ogImage in the shared SSR head payload — never only in client-side Vue/React props.',
      },
      {
        heading: 'Signed URLs',
        body: 'When pages are fully public, enable require-signed-urls on the key and sign in PHP before rendering. See the Signed URLs guide for the HMAC canonical string.',
      },
    ],
    workedSteps: [
      'config/services.php ← OGKIT_KEY',
      'App\\Support\\Ogkit::image()',
      'Pass into Blade/Inertia head.',
      'Follow /guides/signed-urls if the URL is public.',
    ],
  },
  hugo: {
    label: 'Hugo',
    example: `{{/* layouts/partials/ogkit.html — bake absolute cards at hugo build */}}
{{ $title := .Title }}
{{ $sub := .Params.description | default .Site.Params.description }}
{{ $q := querify "key" (getenv "OGKIT_KEY") "title" $title "subtitle" $sub }}
{{ $og := printf "${siteConfig.url}/api/og/article?%s" $q }}
<meta property="og:image" content="{{ $og }}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="{{ $og }}">`,
    checklist: [
      'Generate OGKit URLs during hugo build (static output).',
      'Use .Title / front matter descriptions per page.',
      'Inject OGKIT_KEY via CI getenv — never commit into hugo.toml.',
      'Cover section and taxonomy pages, not only posts.',
      'After content renames, rebuild + rescrape sticky platforms.',
    ],
    pitfalls: [
      'Committing production keys to config.toml / hugo.yaml',
      'Theme default images overriding your partial (check baseof order)',
      'Relative /images/og.png in generated public HTML',
      'One homepage image for every post',
      'Empty getenv("OGKIT_KEY") in CI → broken key= in every page',
    ],
    deepSections: [
      {
        heading: 'Partial + baseof (unique snippet)',
        body: 'Keep one partial and include it from layouts/_default/baseof.html inside <head>. Themes often ship their own og:image — remove or guard those so you do not emit two conflicting tags.',
        code: `{{/* layouts/_default/baseof.html */}}
<head>
  ...
  {{ partial "ogkit.html" . }}
</head>`,
      },
      {
        heading: 'Build-time secrets in CI',
        body: 'Hugo has no runtime. Pass OGKIT_KEY as a CI env var and read it with getenv in the partial. If a theme ever printed the key into HTML comments, rotate immediately.',
        code: `# GitHub Actions
- run: hugo --minify
  env:
    OGKIT_KEY: \${{ secrets.OGKIT_KEY }}`,
      },
      {
        heading: 'Section & taxonomy pages',
        body: 'List and taxonomy pages still unfurl in Slack. Give them distinct titles (e.g. “Docs — Authentication”) so cards are not identical to the homepage.',
      },
      {
        heading: 'Static rescrape workflow',
        body: 'Changing front matter title changes the baked og:image query only after hugo + deploy. Then force Facebook Sharing Debugger / LinkedIn Post Inspector. Slack often needs a new image URL (new fields or v=) — see Troubleshooting.',
      },
    ],
    workedSteps: [
      'Create layouts/partials/ogkit.html with querify + getenv.',
      'Include it from baseof; disable conflicting theme OG tags.',
      'Set OGKIT_KEY in CI build env.',
      'hugo && grep -R "og:image" public | head — confirm absolute HTTPS.',
      'Deploy → rescrape 1–2 URLs in Facebook/LinkedIn.',
    ],
  },
}

const FRAMEWORK_SECTIONS = [
  {
    heading: 'Server-rendered metadata is the SEO boundary',
    body:
      'Open Graph images only help distribution when the final HTML response already contains the metadata. Most scrapers do not wait for client-side JavaScript, so React hydration, client routers, and analytics callbacks are too late. Build the OGKit URL in the server route, loader, layout, view helper, or static generation step that owns the document head.',
  },
  {
    heading: 'Use one deterministic image URL per canonical page',
    body:
      'The strongest pattern is one stable 1200x630 image URL for each canonical URL. Put the same image in Open Graph and Twitter/X metadata, keep the title aligned with the visible H1, and include page-specific context such as author, product name, release version, or docs section. That gives Slack, Discord, LinkedIn, iMessage, and browser-assisted LLM crawlers the same topic signal as the page body.',
  },
  {
    heading: 'When to choose hosted templates over custom renderers',
    body:
      'Custom Satori, Puppeteer, or screenshot routes make sense when you need arbitrary layout control. Hosted templates make more sense when the business need is repeatable: blog cards, launch pages, changelogs, docs pages, product pages, and comparison pages that should look consistent without a renderer living in every codebase.',
  },
] as const

const ALLOWED = new Set(Object.keys(HINT))

type Props = { params: { framework: string } }

function pageOgImage(title: string, subtitle = 'Framework guide') {
  return dogfoodOgImageUrl({ title, subtitle, template: 'minimal' })
}

export function generateMetadata({ params }: Props) {
  if (!ALLOWED.has(params.framework)) return {}
  const details = DETAILS[params.framework]!
  const ogTitle =
    params.framework === 'nextjs' ? 'Next.js OG image generator' : `Dynamic Open Graph images for ${details.label}`
  const title = `${ogTitle} — ${siteConfig.name}`
  const description = clipMetaDescription(
    params.framework === 'nextjs'
      ? 'Next.js App Router: build absolute OGKit image URLs in generateMetadata, set openGraph.images and twitter.images, keep keys server-side. Hosted 1200×630 templates vs maintaining @vercel/og — see compare page and /llms.txt for agents.'
      : `${details.label}: dynamic 1200×630 Open Graph and Twitter/X cards via OGKit HTTPS URLs — server or SSG metadata patterns, pitfalls, and checklist. Framework-agnostic hosted API; pair with /docs and /llms.txt for AI-assisted setup.`,
  )
  const image = pageOgImage(ogTitle, 'Open Graph image API guide')
  const images = ogImageWithAlt(image, title)
  const canonical = absoluteSiteUrl(`/for/${params.framework}`)
  return {
    title: { absolute: title },
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, images },
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
  const faq = [
    {
      question: 'How do I add dynamic Open Graph images to Next.js App Router?',
      answer:
        'Build an absolute OGKit image URL inside generateMetadata (or a server helper), then assign it to metadata.openGraph.images and twitter.images. Use params/slug data so each route gets a unique card.',
    },
    {
      question: 'Can OGKit replace a custom opengraph-image.tsx route?',
      answer:
        'Yes, when you want hosted templates and stable image URLs instead of maintaining a custom Satori route, font loading, and renderer debugging. Prefer one approach per route — do not mix both.',
    },
    {
      question: 'Where should I keep the OGKit API key?',
      answer:
        'Keep the API key in server-side environment variables (OGKIT_KEY). Never NEXT_PUBLIC_OGKIT_KEY or client components.',
    },
    {
      question: 'Why is Slack/Facebook still showing the old Next.js card?',
      answer:
        'Unfurl caches stick to the image URL. Change the OGKit query (title/subtitle or v=), redeploy metadata, then rescrape. See /guides/troubleshooting and /guides/caching-and-rescrape.',
    },
  ]
  return (
    <div className="space-y-12">
      <section>
        <p className="text-sm font-medium text-muted-foreground">Next.js guide</p>
        <h1 className="mt-1 text-4xl font-bold tracking-tight">Next.js OG image generator</h1>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
          OGKit is the hosted path for Next.js Open Graph images: absolute HTTPS URLs from{' '}
          <code className="font-mono">generateMetadata</code>, no{' '}
          <code className="font-mono">opengraph-image.tsx</code>, no Satori fonts, no Edge bundle budget.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold">1) Per-route generateMetadata (primary pattern)</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Build the image URL on the server from route data. Pass the same absolute URL to Open Graph and Twitter. Keep{' '}
          <code className="font-mono">OGKIT_KEY</code> in server env only.
        </p>
        <div className="mt-4">
          <CodeBlock>{`// app/blog/[slug]/page.tsx
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const post = await getPost(params.slug);
  const image = new URL("${siteConfig.url}/api/og/article");
  image.searchParams.set("key", process.env.OGKIT_KEY!);
  image.searchParams.set("title", post.title);
  image.searchParams.set("subtitle", post.excerpt ?? "Blog");
  const url = image.toString();

  return {
    title: post.title,
    openGraph: {
      title: post.title,
      images: [{ url, width: 1200, height: 630, alt: post.title }],
    },
    twitter: { card: "summary_large_image", title: post.title, images: [url] },
  };
}`}</CodeBlock>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold">2) Shared helper (DRY across layouts)</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Extract a tiny server helper so docs, changelog, and marketing pages share one contract.
        </p>
        <div className="mt-4">
          <CodeBlock>{`// lib/ogkit.ts — server-only
export function ogkitArticle(fields: { title: string; subtitle?: string }) {
  const image = new URL("${siteConfig.url}/api/og/article");
  image.searchParams.set("key", process.env.OGKIT_KEY!);
  image.searchParams.set("title", fields.title);
  if (fields.subtitle) image.searchParams.set("subtitle", fields.subtitle);
  return image.toString();
}

// usage in generateMetadata
const url = ogkitArticle({ title: post.title, subtitle: post.excerpt });`}</CodeBlock>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold">3) Static marketing page (build-time URL)</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          For a single landing page you can use a module-scope URL. Still keep the key server-side — this file must not be
          imported from a Client Component.
        </p>
        <div className="mt-4">
          <CodeBlock>{`// app/pricing/page.tsx
const ogImage = new URL("${siteConfig.url}/api/og/brand");
ogImage.searchParams.set("key", process.env.OGKIT_KEY!);
ogImage.searchParams.set("title", "Acme Pricing");
ogImage.searchParams.set("tagline", "Simple plans");

export const metadata = {
  openGraph: { images: [{ url: ogImage.toString(), width: 1200, height: 630 }] },
  twitter: { card: "summary_large_image" as const, images: [ogImage.toString()] },
};`}</CodeBlock>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold">Typical Next.js mistakes</h2>
        <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-muted-foreground">
          {DETAILS.nextjs!.pitfalls.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-5">
            <h3 className="font-semibold">Wrong — client / public env</h3>
            <div className="mt-3">
              <CodeBlock>{`// ❌ leaks key + crawlers may miss tags
"use client";
const url = \`\${process.env.NEXT_PUBLIC_OGKIT}/api/og/...\`;`}</CodeBlock>
            </div>
          </div>
          <div className="rounded-lg border p-5">
            <h3 className="font-semibold">Right — server metadata</h3>
            <div className="mt-3">
              <CodeBlock>{`// ✅ generateMetadata / Server Component only
image.searchParams.set("key", process.env.OGKIT_KEY!);`}</CodeBlock>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold">Rescrape after deploys</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Next.js metadata changes only help after HTML is live <em>and</em> platforms refetch{' '}
          <code className="font-mono">og:image</code>. Deterministic OGKit URLs cache hard — change title/subtitle (or add{' '}
          <code className="font-mono">v=</code>) when the card must update.
        </p>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
          <li>Deploy and curl the page — confirm absolute og:image / twitter:image match.</li>
          <li>
            <code className="font-mono">curl -sI</code> the image URL — expect <code className="font-mono">image/png</code>.
          </li>
          <li>Facebook Sharing Debugger → Scrape Again; LinkedIn Post Inspector.</li>
          <li>Slack: reshare with a new image URL if the old unfurl sticks.</li>
        </ol>
        <p className="mt-3 text-sm text-muted-foreground">
          Full matrix:{' '}
          <Link className="text-primary underline" href={withBasePath('/guides/caching-and-rescrape')}>
            Caching &amp; rescrape
          </Link>
          . Symptom → fix:{' '}
          <Link className="text-primary underline" href={withBasePath('/guides/troubleshooting')}>
            Troubleshooting
          </Link>
          .
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border p-5">
          <h2 className="text-xl font-semibold">Why not always opengraph-image.tsx?</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Custom ImageResponse routes win for pixel-perfect JSX. They also make you own fonts, Edge budgets, and render
            failures. OGKit wins when the job is a reliable 1200×630 card from page fields. Compare:{' '}
            <Link className="text-primary underline" href={withBasePath('/compare/ogkit-vs-vercel-og')}>
              OGKit vs @vercel/og
            </Link>
            .
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

      <section>
        <h2 className="text-2xl font-semibold">Related Next.js SEO pages</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ['OGKit vs Vercel OG', '/compare/ogkit-vs-vercel-og'],
            ['Troubleshooting', '/guides/troubleshooting'],
            ['Caching & rescrape', '/guides/caching-and-rescrape'],
            ['Open Graph image API docs', '/docs'],
            ['Try the Playground', '/playground'],
            ['Open Graph SEO guide', '/blog/open-graph-images-seo-guide'],
          ].map(([label, href]) => (
            <Link key={href} href={withBasePath(href)} className="rounded-lg border p-4 text-sm font-medium hover:bg-muted/50">
              {label}
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold">Frequently asked questions</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {faq.map((item) => (
            <div key={item.question} className="rounded-lg border p-4">
              <h3 className="font-semibold">{item.question}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.answer}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold">Related reading</h2>
        <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-muted-foreground">
          <li>
            <Link className="text-primary underline" href={withBasePath('/guides/troubleshooting')}>
              Troubleshooting OG images
            </Link>{' '}
            — blank cards, wrong titles, key errors, sticky Slack cache.
          </li>
          <li>
            <Link className="text-primary underline" href={withBasePath('/compare/ogkit-vs-vercel-og')}>
              OGKit vs @vercel/og
            </Link>{' '}
            — when a hosted URL API beats maintaining ImageResponse.
          </li>
          <li>
            <Link className="text-primary underline" href={withBasePath('/blog/open-graph-images-seo-guide')}>
              Open Graph images for SEO and social
            </Link>
            .
          </li>
        </ul>
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
    {
      question: 'I changed the title but Slack still shows the old card — what now?',
      answer:
        'Rebuild/redeploy so HTML has the new OGKit query, confirm with curl, then rescrape Facebook/LinkedIn. Slack often needs a new image URL (updated fields or v=). See /guides/troubleshooting.',
    },
  ]
  const canonical = absoluteSiteUrl(`/for/${params.framework}`)
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: siteConfig.name, item: absoluteSiteUrl('') },
      { '@type': 'ListItem', position: 2, name: details.label, item: canonical },
    ],
  }
  const jsonLd = [
    breadcrumbLd,
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
      publisher: { '@type': 'Organization', name: siteConfig.name, url: absoluteSiteUrl('') },
      mainEntityOfPage: canonical,
    },
  ]
  if (params.framework === 'nextjs') {
    const nextFaq = [
      ...faq,
      {
        question: 'Why is Slack/Facebook still showing the old Next.js card?',
        answer:
          'Unfurl caches stick to the image URL. Change the OGKit query (title/subtitle or v=), redeploy metadata, then rescrape. See /guides/troubleshooting and /guides/caching-and-rescrape.',
      },
    ]
    const nextJsonLd = [
      breadcrumbLd,
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: nextFaq.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: { '@type': 'Answer', text: item.answer },
        })),
      },
      {
        '@context': 'https://schema.org',
        '@type': 'TechArticle',
        headline: 'Next.js OG image generator',
        description: HINT.nextjs,
        author: { '@type': 'Organization', name: siteConfig.name },
        publisher: { '@type': 'Organization', name: siteConfig.name, url: absoluteSiteUrl('') },
        mainEntityOfPage: canonical,
      },
    ]
    return (
      <div className="container max-w-4xl py-12">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(nextJsonLd) }} />
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

      <section className="grid gap-4 md:grid-cols-3">
        {FRAMEWORK_SECTIONS.map((section) => (
          <div key={section.heading} className="rounded-lg border p-5">
            <h2 className="text-lg font-semibold">{section.heading}</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{section.body}</p>
          </div>
        ))}
      </section>

      <section>
        <h2 className="text-2xl font-semibold">Implementation pattern</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Generate the OGKit URL before the crawler sees the HTML. That can happen during static generation, in a server
          route, or in the framework metadata layer. Start with the{' '}
          <Link className="text-primary underline" href={withBasePath('/docs')}>
            API reference
          </Link>
          , deep{' '}
          <Link className="text-primary underline" href={withBasePath('/guides')}>
            guides
          </Link>
          , test the URL in the{' '}
          <Link className="text-primary underline" href={withBasePath('/playground')}>
            Playground
          </Link>
          , then validate the deployed page with the{' '}
          <Link className="text-primary underline" href={withBasePath('/tools')}>
            preview debugging tools
          </Link>
          .
        </p>
        <div className="mt-4">
          <CodeBlock>{details.example}</CodeBlock>
        </div>
      </section>

      {details.deepSections && details.deepSections.length > 0 && (
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">Deeper {details.label} notes</h2>
          {details.deepSections.map((section) => (
            <div key={section.heading} className="space-y-3">
              <h3 className="text-lg font-semibold">{section.heading}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{section.body}</p>
              {section.code ? (
                <CodeBlock>{section.code}</CodeBlock>
              ) : null}
            </div>
          ))}
        </section>
      )}

      {details.workedSteps && details.workedSteps.length > 0 && (
        <section>
          <h2 className="text-2xl font-semibold">Worked steps</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
            {details.workedSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>
      )}

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
          and content collections where the title and summary change often. For HMAC signing and rescrape workflows, see{' '}
          <Link className="text-primary underline" href={withBasePath('/guides/signed-urls')}>
            signed URLs
          </Link>{' '}
          and{' '}
          <Link className="text-primary underline" href={withBasePath('/guides/caching-and-rescrape')}>
            caching &amp; rescrape
          </Link>
          .
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

      <section>
        <h2 className="text-2xl font-semibold">Related reading</h2>
        <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-muted-foreground">
          <li>
            <Link className="text-primary underline" href={withBasePath('/guides/troubleshooting')}>
              Troubleshooting OG images
            </Link>{' '}
            — blank cards, wrong titles, key errors, sticky caches.
          </li>
          <li>
            <Link className="text-primary underline" href={withBasePath('/guides/caching-and-rescrape')}>
              Caching &amp; rescrape
            </Link>{' '}
            — platform debugger checklist after static rebuilds.
          </li>
          <li>
            <Link className="text-primary underline" href={withBasePath('/blog/open-graph-images-seo-guide')}>
              Open Graph images for SEO and social
            </Link>
            .
          </li>
        </ul>
      </section>

      <FinishCta />
    </div>
  )
}
