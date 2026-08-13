const basePath = (process.env.NEXT_PUBLIC_BASE_PATH || '').replace(/\/$/, '') || undefined

/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath,
  async redirects() {
    return [
      { source: '/for/next', destination: '/for/nextjs', permanent: true },
      { source: '/use-case/blogs', destination: '/use-case/blog', permanent: true },
      // Legacy / wrong guide slugs from older nav & audits (were 404/500 — content lives elsewhere)
      { source: '/guides/caching', destination: '/guides/caching-and-rescrape', permanent: true },
      { source: '/guides/open-graph-seo', destination: '/blog/open-graph-images-seo-guide', permanent: true },
      { source: '/guides/nextjs', destination: '/for/nextjs', permanent: true },
      { source: '/guides/seo', destination: '/blog/open-graph-images-seo-guide', permanent: true },
      // Collapsed weak compare pages → hub; Satori/Puppeteer → guide
      { source: '/compare/ogkit-vs-metashot', destination: '/compare/ogkit-vs-og-image-apis', permanent: true },
      { source: '/compare/ogkit-vs-ogmagic', destination: '/compare/ogkit-vs-og-image-apis', permanent: true },
      { source: '/compare/ogkit-vs-placid', destination: '/compare/ogkit-vs-og-image-apis', permanent: true },
      { source: '/compare/ogkit-vs-cloudinary', destination: '/compare/ogkit-vs-og-image-apis', permanent: true },
      { source: '/compare/ogkit-vs-ogforge', destination: '/compare/ogkit-vs-og-image-apis', permanent: true },
      { source: '/compare/satori-vs-puppeteer', destination: '/guides/og-image-rendering', permanent: true },
    ]
  },
}

export default nextConfig
