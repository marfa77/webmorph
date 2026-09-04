/**
 * Temporary public-site pause. Flip to `false` to restore marketing pages.
 * OGKit API + signed-in app stay up.
 */
export const WEBMORP_PUBLIC_PAUSED = true

const KEEP_PREFIXES = [
  '/api/',
  '/ogkit/api/',
  '/login',
  '/ogkit/login',
  '/dashboard',
  '/ogkit/dashboard',
  '/account',
  '/ogkit/account',
  '/onboarding',
  '/ogkit/onboarding',
]

export function shouldPausePublicPath(pathname: string): boolean {
  if (!WEBMORP_PUBLIC_PAUSED) return false
  const p = pathname || '/'
  if (KEEP_PREFIXES.some((prefix) => p === prefix.replace(/\/$/, '') || p.startsWith(prefix))) {
    return false
  }
  return true
}

export const PAUSED_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="robots" content="noindex, nofollow, noarchive">
<title></title>
</head>
<body></body>
</html>
`

export const PAUSED_ROBOTS = 'User-agent: *\nDisallow: /\n'
export const PAUSED_LLMS = '# Unavailable\n'
export const PAUSED_SITEMAP =
  '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>\n'
