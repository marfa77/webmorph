export const runtime = 'nodejs'

/**
 * IndexNow key file (HTTPS body = key only).
 * keyLocation in IndexNow submissions: `https://<your-canonical-host>/api/indexnow/key`
 */
export function GET() {
  const key = process.env.INDEXNOW_API_KEY?.trim()
  if (!key) {
    return new Response('IndexNow is not configured (set INDEXNOW_API_KEY).', {
      status: 404,
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    })
  }
  return new Response(key, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=86400',
    },
  })
}
