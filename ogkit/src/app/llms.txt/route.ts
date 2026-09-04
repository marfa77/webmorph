import { buildLlmsTxtBody } from '@/lib/llms-txt-body'
import { PAUSED_LLMS, WEBMORP_PUBLIC_PAUSED } from '@/lib/site-pause'

export const runtime = 'nodejs'

export function GET() {
  const body = WEBMORP_PUBLIC_PAUSED ? PAUSED_LLMS : buildLlmsTxtBody()
  return new Response(body, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=3600',
    },
  })
}
