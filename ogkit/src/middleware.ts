import { getToken } from 'next-auth/jwt'
import { publicPath } from '@/config/paths'
import {
  PAUSED_HTML,
  PAUSED_LLMS,
  PAUSED_ROBOTS,
  PAUSED_SITEMAP,
  shouldPausePublicPath,
} from '@/lib/site-pause'
import { NextResponse, type NextRequest } from 'next/server'

const landingStaticPrefixes = ['/previews/', '/freelancer/', '/restaurant/', '/small-business/', '/startup/']
const landingStaticExtensions = ['.html', '.txt', '.xml', '.svg', '.png', '.jpg', '.jpeg', '.gif', '.webp']

function isLandingStaticPath(pathname: string) {
  return landingStaticPrefixes.some((prefix) => pathname.startsWith(prefix)) || landingStaticExtensions.some((ext) => pathname.endsWith(ext))
}

const pauseHeaders = {
  'X-Robots-Tag': 'noindex, nofollow, noarchive',
  'Cache-Control': 'no-store',
  'Retry-After': '604800',
}

function pausedResponse(pathname: string): NextResponse {
  if (pathname.endsWith('robots.txt')) {
    return new NextResponse(PAUSED_ROBOTS, {
      status: 200,
      headers: { ...pauseHeaders, 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }
  if (pathname.endsWith('llms.txt') || pathname.endsWith('llm.txt')) {
    return new NextResponse(PAUSED_LLMS, {
      status: 503,
      headers: { ...pauseHeaders, 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }
  if (pathname.endsWith('.xml')) {
    return new NextResponse(PAUSED_SITEMAP, {
      status: 503,
      headers: { ...pauseHeaders, 'Content-Type': 'application/xml; charset=utf-8' },
    })
  }
  return new NextResponse(PAUSED_HTML, {
    status: 503,
    headers: { ...pauseHeaders, 'Content-Type': 'text/html; charset=utf-8' },
  })
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (shouldPausePublicPath(pathname)) {
    return pausedResponse(pathname)
  }

  if (isLandingStaticPath(pathname)) {
    return NextResponse.next()
  }

  const protectedPaths = ['/dashboard', '/account', '/onboarding']
  const isProtected = protectedPaths.some((p) => pathname === p || pathname.startsWith(`${p}/`))

  if (isProtected) {
    const token = await getToken({
      req: request,
      secret: process.env.AUTH_SECRET,
      secureCookie: process.env.NODE_ENV === 'production',
    })
    if (!token) {
      return NextResponse.redirect(new URL(publicPath('/login'), request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/og).*)'],
}
