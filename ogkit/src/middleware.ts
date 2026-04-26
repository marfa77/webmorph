import { createServerClient } from '@supabase/ssr'
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

  const makeAppResponse = () => NextResponse.next({ request })

  let supabaseResponse = makeAppResponse()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = makeAppResponse()
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const protectedPaths = ['/dashboard', '/account']
  const isProtected = protectedPaths.some((p) => pathname === p || pathname.startsWith(`${p}/`))

  if (isProtected && !user) {
    return NextResponse.redirect(new URL(withBasePath('/login'), request.url))
  }
  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/og).*)',
  ],
}
