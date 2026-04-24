import { withBasePath } from '@/config/paths'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'
  const nextPath = next.startsWith('/') ? next : `/${next}`

  if (searchParams.get('error')) {
    return NextResponse.redirect(
      new URL(`${withBasePath('/login')}?error=auth&reason=provider`, origin).toString(),
    )
  }

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(new URL(withBasePath(nextPath), origin).toString())
    }
    return NextResponse.redirect(
      new URL(`${withBasePath('/login')}?error=auth&reason=session`, origin).toString(),
    )
  }

  return NextResponse.redirect(new URL(`${withBasePath('/login')}?error=auth&reason=link`, origin).toString())
}
