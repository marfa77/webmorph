import Link from 'next/link'
import { siteConfig } from '@/config/site'
import { absoluteSiteUrl, withBasePath } from '@/config/paths'
import { notFound } from 'next/navigation'
import { FinishCta } from '@/components/marketing/finish-cta'
import { clipMetaDescription } from '@/lib/seo-meta'

const COPY: Record<string, string> = {
  blog:
    'For blog posts, use the article template with `title`, optional `subtitle`, `author`, and `image` for a hero. OGKit creates a unique social preview image for each post without custom image rendering code.',
  blogs:
    'For posts, use the article template with `title`, optional `subtitle`, and `image` for a hero. Share the same image URL in Open Graph and Twitter card meta tags to keep link previews on-brand across Slack, iMessage, and X.',
  changelog:
    'Changelog pages need repeatable, branded preview cards for every release. Use brand, gradient, or minimal templates with release titles and short summaries so every product update has a shareable image.',
  'product-launch':
    'Product launches need social cards that look polished on X, LinkedIn, Slack, Discord, and iMessage. Use product, brand, or gradient templates to generate launch images from title, tagline, logo, and product artwork.',
  ecommerce:
    'Product pages benefit from the product template: `title`, `price`, `image`, and optional `logo` for a clean commerce card. Generate the URL in your product detail route (server side) to avoid embedding secrets in the HTML.',
  docs: 'Docs sites: minimal or article templates work for guide titles and a short subheading. You can also use the dark-code template for technical snippets in preview cards on developer-focused networks.',
  saas:
    'SaaS landing and changelog pages can use brand or gradient templates for a bold preview. The API caps usage per plan—use one key per environment in production and staging.',
  portfolios:
    'For portfolios, minimal or gradient helps keep the focus on your work title and a short line of copy. Set `og:image` per project page with unique titles to avoid repeated previews in social clients.',
  'dynamic-social-preview-images':
    'Dynamic social preview images are Open Graph and Twitter card images generated from page data instead of designed manually. OGKit turns titles, subtitles, logos, product names, authors, and hero images into stable 1200x630 PNG URLs.',
}

const DETAILS: Record<string, { template: string; fields: string[]; exampleTitle: string; exampleSubtitle: string; mistakes: string[] }> = {
  blog: {
    template: 'article',
    fields: ['title', 'subtitle', 'author', 'image'],
    exampleTitle: 'How we shipped faster',
    exampleSubtitle: 'A practical launch note for builders',
    mistakes: ['Reusing the homepage image for every post', 'Putting the API key in client-side JavaScript', 'Forgetting twitter:image'],
  },
  blogs: {
    template: 'article',
    fields: ['title', 'subtitle', 'author', 'image'],
    exampleTitle: 'How we shipped faster',
    exampleSubtitle: 'A practical launch note for builders',
    mistakes: ['Reusing one generic card', 'Generating images at build time with stale copy', 'Skipping image width and height metadata'],
  },
  changelog: {
    template: 'gradient',
    fields: ['title', 'subtitle', 'accent', 'pattern'],
    exampleTitle: 'Changelog v2.4',
    exampleSubtitle: 'New templates, signed URLs, and faster previews',
    mistakes: ['Using internal release names as public titles', 'Writing summaries that are too long for link previews', 'Not giving each release a unique image'],
  },
  'product-launch': {
    template: 'product',
    fields: ['title', 'price', 'image', 'logo'],
    exampleTitle: 'OGKit Pro',
    exampleSubtitle: 'Crypto-native Open Graph images',
    mistakes: ['Using screenshots that crop badly in Slack', 'Forgetting product logo contrast', 'Making the card depend on a slow webpage screenshot'],
  },
  ecommerce: {
    template: 'product',
    fields: ['title', 'price', 'image', 'logo'],
    exampleTitle: 'Portuguese A2 Practice Pack',
    exampleSubtitle: 'Digital product card',
    mistakes: ['Not URL-encoding product names', 'Embedding secret keys in storefront HTML', 'Using tiny product photos that blur at 1200x630'],
  },
  docs: {
    template: 'dark-code',
    fields: ['title', 'code', 'language'],
    exampleTitle: 'API reference',
    exampleSubtitle: 'GET /api/og/{template}',
    mistakes: ['Sharing every docs page with the same logo card', 'Putting too much code in the preview', 'Forgetting docs-site navigation titles'],
  },
  saas: {
    template: 'brand',
    fields: ['title', 'tagline', 'logo'],
    exampleTitle: 'Acme Launch',
    exampleSubtitle: 'Ship customer-facing pages faster',
    mistakes: ['Letting customer pages share the generic homepage preview', 'Skipping domain controls for public URLs', 'Using marketing copy that is unreadable at small preview sizes'],
  },
  portfolios: {
    template: 'minimal',
    fields: ['title', 'subtitle', 'accent'],
    exampleTitle: 'Selected Work',
    exampleSubtitle: 'Product design and engineering',
    mistakes: ['Using one preview for every case study', 'Writing vague project titles', 'Not matching accent colors to the portfolio brand'],
  },
  'dynamic-social-preview-images': {
    template: 'minimal',
    fields: ['title', 'subtitle', 'accent', 'theme'],
    exampleTitle: 'Dynamic social preview images',
    exampleSubtitle: 'Generate a unique card for every page',
    mistakes: ['Treating OG images as static brand assets', 'Depending on browser screenshots for simple cards', 'Not testing previews in Slack and LinkedIn'],
  },
}

const USE_CASE_SECTIONS = [
  {
    heading: 'Why page-specific preview images matter',
    body:
      'Search results, social feeds, chat apps, and AI browsing surfaces all compress a page into a few visible signals: title, description, URL, and image. A static homepage card wastes that surface area on specific URLs. Dynamic Open Graph images let each blog post, release note, product page, or docs guide show the exact headline and context a visitor expects before the click.',
  },
  {
    heading: 'The operational pattern',
    body:
      'Keep the template choice boring and repeatable. Store the page title, subtitle, author, price, or release name in your CMS or database, build an OGKit URL on the server, and emit the final HTTPS image in both og:image and twitter:image. The image URL becomes part of the page contract, just like the canonical URL and meta description.',
  },
  {
    heading: 'How to avoid stale previews',
    body:
      'Unfurlers cache image URLs aggressively. If a title or product visual changes materially, version the query string, update the signed URL, or force a rescrape with platform validators. Deterministic URLs are good for cache hit rate, but content teams still need a refresh habit after important launches and edits.',
  },
] as const

const ALLOWED = new Set(Object.keys(COPY))
type Props = { params: { type: string } }

function buildUseCaseMetaDescription(type: string, label: string): string {
  const details = DETAILS[type]!
  const fields = details.fields.join(', ')
  return `${label}: OGKit ${details.template} template for 1200×630 Open Graph & Twitter/X cards. Query fields: ${fields}. Hosted API, demo=1 previews, signed URLs on paid plans. Works with Next.js, Astro, Rails, and static sites.`
}

export function generateMetadata({ params }: Props) {
  if (!ALLOWED.has(params.type)) return {}
  const details = DETAILS[params.type]!
  const label = humanize(params.type)
  const image = new URL(`${siteConfig.url}/api/og/minimal`)
  image.searchParams.set('demo', '1')
  image.searchParams.set('title', `${label} Open Graph images`)
  image.searchParams.set('subtitle', `Template: ${details.template}`)
  image.searchParams.set('accent', '#2563eb')
  const canonical = absoluteSiteUrl(`/use-case/${params.type}`)
  if (params.type === 'dynamic-social-preview-images') {
    const title = `Dynamic social preview images — ${siteConfig.name}`
    const description = clipMetaDescription(
      'Complete guide: dynamic Open Graph and Twitter/X preview images from one URL, metadata patterns for Next.js and other frameworks, OGKit templates, demo mode, signed URLs, and mistakes to avoid in Slack and LinkedIn.',
    )
    return {
      title: { absolute: title },
      description,
      alternates: { canonical },
      openGraph: { title, description, url: canonical, images: [image.toString()] },
      twitter: { card: 'summary_large_image', title, description, images: [image.toString()] },
    }
  }
  const title = `${label} Open Graph images — ${siteConfig.name}`
  const description = clipMetaDescription(buildUseCaseMetaDescription(params.type, label))
  return {
    title: { absolute: title },
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, images: [image.toString()] },
    twitter: { card: 'summary_large_image', title, description, images: [image.toString()] },
  }
}

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-lg border bg-muted/40 p-4 text-xs leading-relaxed">
      <code className="font-mono">{children}</code>
    </pre>
  )
}

function humanize(value: string) {
  return value
    .split('-')
    .join(' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function DynamicSocialPreviewGuide() {
  return (
    <div className="space-y-12">
      <section>
        <p className="text-sm font-medium text-muted-foreground">How-to guide</p>
        <h1 className="mt-1 text-4xl font-bold tracking-tight">Dynamic social preview images</h1>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
          OGKit generates dynamic social preview images for Open Graph, Twitter cards, Slack, Discord, LinkedIn, iMessage,
          docs pages, product launches, and changelogs. One URL becomes the canonical image for every place your link is shared.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold">The minimal pattern</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Pick a template, pass page-specific fields, and use the resulting PNG URL in both Open Graph and Twitter metadata.
        </p>
        <div className="mt-4">
          <CodeBlock>{`const image = new URL("${siteConfig.url}/api/og/minimal");
image.searchParams.set("key", process.env.OGKIT_KEY!);
image.searchParams.set("title", post.title);
image.searchParams.set("subtitle", post.description);

const meta = {
  openGraph: { images: [image.toString()] },
  twitter: { card: "summary_large_image", images: [image.toString()] }
};`}</CodeBlock>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          ['Blogs and docs', 'Generate article cards from title, subtitle, author, and hero image.'],
          ['Product launches', 'Generate launch cards from logo, tagline, product name, and artwork.'],
          ['Changelogs', 'Give every release note a unique branded preview instead of reusing the homepage card.'],
        ].map(([title, copy]) => (
          <div key={title} className="rounded-lg border p-5">
            <h2 className="font-semibold">{title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{copy}</p>
          </div>
        ))}
      </section>

      <section>
        <h2 className="text-2xl font-semibold">When OGKit is the right tool</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Use OGKit when you want a focused Open Graph image API instead of a screenshot API, a manual design workflow,
          or a custom Vercel OG implementation.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['OGKit vs screenshot APIs', '/compare/ogkit-vs-screenshot-apis'],
            ['OGKit vs Bannerbear', '/compare/ogkit-vs-bannerbear'],
            ['OGKit vs Placid', '/compare/ogkit-vs-placid'],
            ['Next.js OG generator', '/for/nextjs'],
            ['llms.txt for agents', '/llms.txt'],
          ].map(([label, href]) => (
            <Link key={href} href={withBasePath(href)} className="rounded-lg border p-4 text-sm font-medium hover:bg-muted/50">
              {label}
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border p-5">
          <h2 className="text-xl font-semibold">Common implementation mistakes</h2>
          <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-muted-foreground">
            {DETAILS['dynamic-social-preview-images']!.mistakes.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg border p-5">
          <h2 className="text-xl font-semibold">Production checklist</h2>
          <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-muted-foreground">
            <li>Generate the image URL on the server or during static generation.</li>
            <li>Set both Open Graph and Twitter card images.</li>
            <li>Use signed URLs or domain allowlists for public production pages.</li>
            <li>Keep every generated image at the standard 1200x630 size.</li>
          </ul>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold">Frequently asked questions</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {[
            {
              question: 'What is a dynamic social preview image?',
              answer: 'It is an Open Graph or Twitter card image generated from page data such as title, subtitle, author, product, or changelog details instead of one static image reused everywhere.',
            },
            {
              question: 'Where should I use the generated image URL?',
              answer: 'Use the same final HTTPS image URL in og:image and twitter:image metadata so social platforms and chat apps render a consistent preview.',
            },
            {
              question: 'Is OGKit a screenshot API?',
              answer: 'No. OGKit generates designed 1200x630 cards from structured fields. Screenshot APIs capture already-rendered webpages.',
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

export default function UseCasePage({ params }: Props) {
  if (!ALLOWED.has(params.type)) notFound()
  const details = DETAILS[params.type]!
  const title = humanize(params.type)
  const faq = [
    {
      question: `What is the best OGKit template for ${title.toLowerCase()} pages?`,
      answer: `Start with the ${details.template} template and pass ${details.fields.join(', ')} as query fields when building the image URL.`,
    },
    {
      question: 'Should I generate Open Graph images dynamically or use one static card?',
      answer: 'Use dynamic images when each page has a different title, product, release, author, or summary. Static cards are fine for homepages but weak for specific shared links.',
    },
    {
      question: 'Where should I place the generated image URL?',
      answer: 'Use the final HTTPS image URL in both og:image and twitter:image metadata so social networks, chat apps, and search previews show the same branded card.',
    },
  ]
  const canonical = absoluteSiteUrl(`/use-case/${params.type}`)
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: siteConfig.name, item: absoluteSiteUrl('') },
      { '@type': 'ListItem', position: 2, name: `${title} Open Graph images`, item: canonical },
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
      headline: `${title} Open Graph images`,
      description: COPY[params.type],
      author: { '@type': 'Organization', name: siteConfig.name },
      publisher: { '@type': 'Organization', name: siteConfig.name, url: absoluteSiteUrl('') },
      mainEntityOfPage: canonical,
    },
  ]
  if (params.type === 'dynamic-social-preview-images') {
    return (
      <div className="container max-w-4xl py-12">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <DynamicSocialPreviewGuide />
      </div>
    )
  }
  const t = params.type
  return (
    <div className="container max-w-4xl space-y-12 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section>
        <p className="text-sm font-medium text-muted-foreground">Use case</p>
        <h1 className="mt-1 text-4xl font-bold tracking-tight">{title} Open Graph images</h1>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{COPY[t]!}</p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Add the generated URL to <code className="font-mono">og:image</code> and{' '}
          <code className="font-mono">twitter:image</code> so search previews, social networks, chat apps, and LLM browsing
          tools see a consistent branded card.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {USE_CASE_SECTIONS.map((section) => (
          <div key={section.heading} className="rounded-lg border p-5">
            <h2 className="text-lg font-semibold">{section.heading}</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{section.body}</p>
          </div>
        ))}
      </section>

      <section>
        <h2 className="text-2xl font-semibold">Recommended OGKit template</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Start with the <code className="font-mono">{details.template}</code> template. It keeps the request predictable while
          still giving each {title.toLowerCase()} page its own image, headline, and visual context.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {details.fields.map((field) => (
            <div key={field} className="rounded-lg border p-4 text-sm">
              <code className="font-mono">{field}</code>
              <p className="mt-1 text-muted-foreground">Use this query field when building the image URL server-side.</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold">Copy-paste example</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          This pattern works in any framework that can output metadata. Keep the key in server-side code, then place the final
          HTTPS URL in both Open Graph and Twitter metadata. Use the{' '}
          <Link className="text-primary underline" href={withBasePath('/docs')}>
            API docs
          </Link>{' '}
          for all template fields, test copy in the{' '}
          <Link className="text-primary underline" href={withBasePath('/playground')}>
            Playground
          </Link>
          , and read the{' '}
          <Link className="text-primary underline" href={withBasePath('/blog/open-graph-images-seo-guide')}>
            Open Graph SEO guide
          </Link>{' '}
          before wiring production pages.
        </p>
        <div className="mt-4">
          <CodeBlock>{`const image = new URL("${siteConfig.url}/api/og/${details.template}");
image.searchParams.set("key", process.env.OGKIT_KEY!);
image.searchParams.set("title", "${details.exampleTitle}");
image.searchParams.set("subtitle", "${details.exampleSubtitle}");

export const metadata = {
  title: { absolute: "Page title — ${siteConfig.name}" },
  openGraph: { images: [image.toString()] },
  twitter: { card: "summary_large_image", images: [image.toString()] }
};`}</CodeBlock>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border p-5">
          <h2 className="text-xl font-semibold">Common mistakes</h2>
          <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-muted-foreground">
            {details.mistakes.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg border p-5">
          <h2 className="text-xl font-semibold">When to use dynamic images</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Use dynamic images when every page has a different title, release, product, guide, or author. Static social cards
            are fine for a homepage, but they waste clicks when shared links point to specific content.
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold">Related implementation pages</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['Next.js guide', '/for/nextjs'],
            ['API reference', '/docs'],
            ['Preview validators', '/tools'],
            ['Dynamic preview guide', '/use-case/dynamic-social-preview-images'],
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
