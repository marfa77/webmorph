import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendTelegramMessage } from '@/lib/notifications/telegram'

const Body = z.object({
  email: z.string().email().max(320),
  plan: z.enum(['pro', 'scale']),
})

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function notifyWaitlistRequest(email: string, plan: 'pro' | 'scale', already: boolean) {
  await sendTelegramMessage({
    text: [
      already ? 'OGKit waitlist request (already listed)' : 'New OGKit waitlist request',
      `Plan: ${plan}`,
      `Email: ${email}`,
      `Time: ${new Date().toISOString()}`,
    ].join('\n'),
  })
}

export async function POST(req: Request) {
  const json = await req.json().catch(() => null)
  const parsed = Body.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Waitlist insert failed: missing_server_env')
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
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
      await notifyWaitlistRequest(parsed.data.email.trim().toLowerCase(), parsed.data.plan, true)
      return NextResponse.json({ ok: true, already: true })
    }
    console.error('Waitlist insert failed', { code, message: msg })
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }

  await notifyWaitlistRequest(parsed.data.email.trim().toLowerCase(), parsed.data.plan, false)

  return NextResponse.json({ ok: true })
}
