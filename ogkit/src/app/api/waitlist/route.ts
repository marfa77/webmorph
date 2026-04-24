import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'

const Body = z.object({
  email: z.string().email().max(320),
  plan: z.enum(['pro', 'scale']),
})

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const json = await req.json().catch(() => null)
  const parsed = Body.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }
  const supabase = createAdminClient()
  const { error } = await supabase.from('subscription_waitlist').insert({
    email: parsed.data.email.trim().toLowerCase(),
    plan_interest: parsed.data.plan,
  })

  if (error) {
    const code = (error as { code?: string }).code
    const msg = (error as { message?: string }).message ?? ''
    if (code === '23505' || /unique|duplicate/i.test(msg)) {
      return NextResponse.json({ ok: true, already: true })
    }
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
