import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { ensureDefaultApiKey } from '@/lib/api/ensure-default-key'

/** Idempotent: create a default API key on first sign-in if the user has none. */
export async function POST() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const result = await ensureDefaultApiKey(session.user.id, {
    email: session.user.email,
    source: 'onboarding_bootstrap',
  })

  if (result.created) {
    return NextResponse.json({
      bootstrapped: true,
      key: result.key,
      prefix: result.prefix,
    })
  }

  return NextResponse.json({
    bootstrapped: false,
    prefix: result.prefix,
  })
}
