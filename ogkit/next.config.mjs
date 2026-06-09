const basePath = (process.env.NEXT_PUBLIC_BASE_PATH || '').replace(/\/$/, '') || undefined

/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath,
  async redirects() {
    return [
      { source: '/for/next', destination: '/for/nextjs', permanent: true },
      { source: '/use-case/blogs', destination: '/use-case/blog', permanent: true },
    ]
  },
}

export default nextConfig
