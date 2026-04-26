import Link from 'next/link'
import { siteConfig } from '@/config/site'
import { withBasePath } from '@/config/paths'
import { notFound } from 'next/navigation'
import { FinishCta } from '@/components/marketing/finish-cta'

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

const ALLOWED = new Set(Object.keys(COPY))
type Props = { params: { type: string } }

export function generateMetadata({ params }: Props) {
  if (!ALLOWED.has(params.type)) return {}
  if (params.type === 'dynamic-social-preview-images') {
    return {
      title: `Dynamic social preview images — ${siteConfig.name}`,
      description:
        'Generate dynamic social preview images for Open Graph and Twitter cards with code examples, metadata setup, and reusable OGKit templates.',
    }
  }
  return {
    title: `${params.type} Open Graph images — ${siteConfig.name}`,
    description: `Generate dynamic Open Graph images for ${params.type} pages with the OGKit social preview image API.`,
  }
}

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-lg border bg-muted/40 p-4 text-xs leading-relaxed">
      <code className="font-mono">{children}</code>
    </pre>
  )
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
          <CodeBlock>{`const image = new URL("https://webmorp.art/api/og/minimal");
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
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            ['OGKit vs screenshot APIs', '/compare/ogkit-vs-screenshot-apis'],
            ['OGKit vs Bannerbear', '/compare/ogkit-vs-bannerbear'],
            ['Next.js OG generator', '/for/nextjs'],
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

export default function UseCasePage({ params }: Props) {
  if (!ALLOWED.has(params.type)) notFound()
  if (params.type === 'dynamic-social-preview-images') {
    return (
      <div className="container max-w-4xl py-12">
        <DynamicSocialPreviewGuide />
      </div>
    )
  }
  const t = params.type
  return (
    <div className="container max-w-3xl py-12">
      <h1 className="text-3xl font-bold">
        {t.charAt(0).toUpperCase() + t.slice(1).replace('-', ' ')} Open Graph images
      </h1>
      <p className="mt-4 text-muted-foreground leading-relaxed">{COPY[t]!}</p>
      <p className="mt-3 text-sm text-muted-foreground">
        Add the generated URL to `og:image` and `twitter:image` so search previews, social networks, chat apps, and LLM
        browsing tools see a consistent branded card.
      </p>
      <FinishCta />
    </div>
  )
}
