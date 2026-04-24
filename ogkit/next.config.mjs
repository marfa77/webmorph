const basePath = (process.env.NEXT_PUBLIC_BASE_PATH || '').replace(/\/$/, '') || undefined

/** @type {import('next').NextConfig} */
const nextConfig = {
  // https://www.webmorph.art/ogkit — set NEXT_PUBLIC_BASE_PATH=/ogkit in production
  basePath: basePath || undefined,
}

export default nextConfig
