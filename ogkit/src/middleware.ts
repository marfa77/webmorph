import { createServerClient } from '@supabase/ssr'
import { publicBasePath, withBasePath } from '@/config/paths'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.includes('/api/og')) {
    return NextResponse.next()
  }

  let supabaseResponse = NextResponse.next({ request })
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
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname
  const rel = publicBasePath && path.startsWith(publicBasePath) ? path.slice(publicBasePath.length) || '/' : path
  const protectedPaths = ['/dashboard', '/account']
  const isProtected = protectedPaths.some((p) => rel === p || rel.startsWith(`${p}/`))

  if (isProtected && !user) {
    return NextResponse.redirect(new URL(withBasePath('/login'), request.url))
  }
  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/og|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
