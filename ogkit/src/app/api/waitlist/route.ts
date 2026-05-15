import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { subscriptionWaitlist } from '@/lib/db/schema'
import { trackFunnelEvent } from '@/lib/analytics/funnel'

const Body = z.object({
  email: z.string().email().max(320),
  plan: z.enum(['pro', 'scale']),
})

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function isDuplicateKeyError(e: unknown): boolean {
  const err = e as { errno?: number; message?: string }
  if (err.errno === 1062) return true
  return /duplicate|unique/i.test(err.message ?? '')
}

async function notifyWaitlistRequest(email: string, plan: 'pro' | 'scale', already: boolean) {
  await trackFunnelEvent({
    eventName: 'waitlist_requested',
    email,
    source: 'pricing',
    properties: { plan, already },
    notify: true,
  })
}

export async function POST(req: Request) {
  const json = await req.json().catch(() => null)
  const parsed = Body.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  if (!process.env.DATABASE_URL) {
    console.error('Waitlist insert failed: missing_server_env')
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }

  try {
    await db.insert(subscriptionWaitlist).values({
      email: parsed.data.email.trim().toLowerCase(),
      planInterest: parsed.data.plan,
    })
  } catch (e) {
    if (isDuplicateKeyError(e)) {
      await notifyWaitlistRequest(parsed.data.email.trim().toLowerCase(), parsed.data.plan, true)
      return NextResponse.json({ ok: true, already: true })
    }
    console.error('Waitlist insert failed', e)
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }

  await notifyWaitlistRequest(parsed.data.email.trim().toLowerCase(), parsed.data.plan, false)

  return NextResponse.json({ ok: true })
}
