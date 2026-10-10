import { buildLlmsTxtBody } from '@/lib/llms-txt-body'

export const runtime = 'nodejs'

/** Alias for crawlers and users who type /llm.txt — same body as /llms.txt */
export function GET() {
  const body = buildLlmsTxtBody()
  return new Response(body, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=3600',
    },
  })
}
