import { absoluteSiteUrl } from '@/config/paths'
import type { MetadataRoute } from 'next'

function absoluteUrl(path: string) {
  const p = path.startsWith('/') ? path : `/${path}`
  return absoluteSiteUrl(p === '/' ? '' : p)
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  const routes = [
    '',
    '/docs',
    '/blog',
    '/blog/open-graph-images-seo-guide',
    '/playground',
    '/pricing',
    '/tools',
    '/contact',
    '/privacy',
    '/terms',
    '/llms.txt',
    '/llm.txt',
    // Next.js framework guide: canonical URL is /for/nextjs (/for/next → 301 in next.config.mjs).
    '/for/nextjs',
    '/for/react',
    '/for/remix',
    '/for/astro',
    '/for/nuxt',
    '/for/svelte',
    '/for/rails',
    '/for/django',
    '/for/laravel',
    '/for/hugo',
    '/compare/ogkit-vs-vercel-og',
    '/compare/ogkit-vs-metashot',
    '/compare/ogkit-vs-ogmagic',
    '/compare/ogkit-vs-bannerbear',
    '/compare/ogkit-vs-placid',
    '/compare/ogkit-vs-screenshot-apis',
    '/compare/ogkit-vs-cloudinary',
    '/compare/ogkit-vs-ogforge',
    '/compare/satori-vs-puppeteer',
    '/platform/vercel',
    '/platform/netlify',
    '/platform/cloudflare',
    '/platform/self-hosted',
    '/use-case/dynamic-social-preview-images',
    '/use-case/blog',
    '/use-case/changelog',
    '/use-case/product-launch',
    '/use-case/docs',
    '/use-case/saas',
    '/use-case/ecommerce',
    '/use-case/portfolios',
  ]

  function priorityFor(route: string): number {
    if (route === '') return 1
    if (route === '/docs' || route === '/playground') return 0.95
    if (route.startsWith('/blog/')) return 0.9
    if (route.startsWith('/compare/') || route.startsWith('/for/')) return 0.85
    if (route.startsWith('/use-case/')) return 0.82
    if (route.startsWith('/platform/')) return 0.8
    if (route === '/pricing' || route === '/tools') return 0.88
    if (route === '/llms.txt' || route === '/llm.txt') return 0.75
    if (route === '/privacy' || route === '/terms' || route === '/contact') return 0.35
    if (route === '/blog') return 0.9
    return 0.7
  }

  return routes.map((route) => ({
    url: absoluteUrl(route),
    lastModified: now,
    changeFrequency: route === '' ? 'weekly' : route.startsWith('/compare/') ? 'monthly' : ('monthly' as const),
    priority: priorityFor(route),
  }))
}
