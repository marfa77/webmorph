import { siteConfig } from '@/config/site'
import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteConfig.url
  const now = new Date()
  const routes = [
    '',
    '/docs',
    '/playground',
    '/pricing',
    '/tools',
    '/for/nextjs',
    '/for/react',
    '/for/remix',
    '/for/astro',
    '/platform/vercel',
    '/platform/netlify',
    '/platform/cloudflare',
    '/use-case/blog',
    '/use-case/changelog',
    '/use-case/product-launch',
    '/use-case/docs',
    '/use-case/saas',
  ]

  return routes.map((route) => ({
    url: `${base}${route}`,
    lastModified: now,
    changeFrequency: route === '' ? 'weekly' : 'monthly',
    priority: route === '' ? 1 : route === '/playground' ? 0.9 : 0.7,
  }))
}
