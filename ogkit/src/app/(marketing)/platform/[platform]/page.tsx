import { siteConfig } from '@/config/site'
import { notFound } from 'next/navigation'
import { FinishCta } from '@/components/marketing/finish-cta'

const COPY: Record<string, string> = {
  vercel:
    'Host this Next.js app on Vercel, set your `NEXT_PUBLIC_APP_URL` to the deployment origin, and point `og:image` to the same project’s `/api/og/...` route. Edge and Node runtimes are supported; the OG route runs on Node for key verification.',
  netlify:
    'Deploy the app to Netlify, set public URL env vars, and use the generated OG image URL in your page metadata. Keep your API key server-side or in a serverless function that builds the image URL.',
  cloudflare:
    'If you use Cloudflare in front of the app, cache `GET /api/og/...` at the edge as suitable; the response includes cache headers. Do not expose your key in public HTML—build the URL in your origin when possible.',
  'self-hosted':
    'Run the app behind your own reverse proxy. Expose one public HTTPS host for the API, store `API_KEY_SALT` and Supabase keys in env, and use the same `/api/og/{template}` pattern as in the docs.',
}

const ALLOWED = new Set(Object.keys(COPY))
type Props = { params: { platform: string } }

export function generateMetadata({ params }: Props) {
  if (!ALLOWED.has(params.platform)) return {}
  return {
    title: `Open Graph image API on ${params.platform} — ${siteConfig.name}`,
    description: `Deploy OGKit on ${params.platform} and generate dynamic social preview images from one URL.`,
  }
}

export default function PlatformPage({ params }: Props) {
  if (!ALLOWED.has(params.platform)) notFound()
  const p = params.platform
  return (
    <div className="container max-w-3xl py-12">
      <h1 className="text-3xl font-bold capitalize">Open Graph image API on {p.replace('-', ' ')}</h1>
      <p className="mt-4 text-muted-foreground leading-relaxed">{COPY[p]!}</p>
      <p className="mt-3 text-sm text-muted-foreground">
        Use these pages when evaluating OGKit as a hosted Vercel OG alternative, screenshot-service alternative, or
        framework-neutral social preview image API.
      </p>
      <FinishCta />
    </div>
  )
}
