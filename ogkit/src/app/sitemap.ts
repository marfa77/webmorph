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
    '/compare/ogkit-vs-vercel-og',
    '/compare/ogkit-vs-bannerbear',
    '/compare/ogkit-vs-screenshot-apis',
    '/compare/ogkit-vs-placid',
    '/compare/satori-vs-puppeteer',
    '/platform/vercel',
    '/platform/netlify',
    '/platform/cloudflare',
    '/use-case/dynamic-social-preview-images',
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
