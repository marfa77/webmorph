import { getToken } from 'next-auth/jwt'
import { withBasePath } from '@/config/paths'
import { NextResponse, type NextRequest } from 'next/server'

const landingStaticPrefixes = ['/previews/', '/freelancer/', '/restaurant/', '/small-business/', '/startup/']
const landingStaticExtensions = ['.html', '.txt', '.xml', '.svg', '.png', '.jpg', '.jpeg', '.gif', '.webp']

function isLandingStaticPath(pathname: string) {
  return landingStaticPrefixes.some((prefix) => pathname.startsWith(prefix)) || landingStaticExtensions.some((ext) => pathname.endsWith(ext))
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

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
      return NextResponse.redirect(new URL(withBasePath('/login'), request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/og).*)'],
}
