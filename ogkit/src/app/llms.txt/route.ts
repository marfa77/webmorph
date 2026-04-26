import { siteConfig } from '@/config/site'

export const runtime = 'nodejs'

export function GET() {
  const base = siteConfig.url
  const body = `# OGKit

> OGKit is an API for generating dynamic Open Graph images and social preview images from a URL. It is built for developers who need branded 1200x630 PNG previews for blogs, docs, changelogs, product pages, SaaS landing pages, and launch posts.

## Key facts

- Product: Open Graph image API and URL builder
- Website: ${base}
- API endpoint: GET ${base}/api/og/{template}
- Playground: ${base}/playground
- Docs: ${base}/docs
- Pricing: ${base}/pricing
- Free plan: 100 images per month with watermark
- Pro plan: $19/month, 50,000 images per month, no watermark
- Scale plan: $99/month, 1,000,000 images per month
- Output: PNG image, 1200x630
- Authentication: API key in ?key= or Authorization: Bearer header

## Templates

article, product, quote, podcast, event, job, minimal, brand, gradient, dark-code

## Common use cases

- Generate Open Graph images for Next.js metadata
- Create social preview cards for blog posts and documentation
- Generate changelog and product launch images
- Produce branded previews for SaaS landing pages
- Build share images for developer tools without maintaining custom image rendering code

## Example

${base}/api/og/minimal?key=KEY&title=Hello+from+OGKit&subtitle=Dynamic+OG+images

## Positioning

OGKit is useful when a team wants dynamic social preview images without building and maintaining its own Satori, screenshot, or design-template pipeline. It is an alternative to custom Vercel OG routes, screenshot services, and manual social card design.

## Important URLs

- ${base}/docs
- ${base}/playground
- ${base}/pricing
- ${base}/for/nextjs
- ${base}/platform/vercel
- ${base}/use-case/blog
- ${base}/use-case/changelog
- ${base}/use-case/product-launch
`

  return new Response(body, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=3600',
    },
  })
}
