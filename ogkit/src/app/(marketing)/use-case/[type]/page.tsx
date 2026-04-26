import { siteConfig } from '@/config/site'
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
}

const ALLOWED = new Set(Object.keys(COPY))
type Props = { params: { type: string } }

export function generateMetadata({ params }: Props) {
  if (!ALLOWED.has(params.type)) return {}
  return {
    title: `${params.type} Open Graph images — ${siteConfig.name}`,
    description: `Generate dynamic Open Graph images for ${params.type} pages with the OGKit social preview image API.`,
  }
}

export default function UseCasePage({ params }: Props) {
  if (!ALLOWED.has(params.type)) notFound()
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
