import { absoluteSiteUrl } from '@/config/paths'
import { siteConfig } from '@/config/site'

export type Crumb = { name: string; path: string }

/**
 * Build a schema.org `BreadcrumbList` JSON-LD object from a list of crumbs.
 * The root (siteConfig.name → `/`) is prepended automatically.
 */
export function breadcrumbListJsonLd(crumbs: Crumb[]) {
  const items = [{ name: siteConfig.name, path: '' }, ...crumbs]
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: absoluteSiteUrl(c.path === '' || c.path === '/' ? '' : c.path),
    })),
  }
}
