import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { trackFunnelEventSoon } from '@/lib/analytics/funnel'
import { generateKey } from '@/lib/api/keys'

const CreateSchema = z.object({ name: z.string().min(1).max(64).default('default') })

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('api_keys')
    .select('id,name,prefix,last_used_at,created_at,revoked_at,allowed_domains,require_signed_urls')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ keys: data ?? [] })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const json = await req.json().catch(() => ({}))
  const parsed = CreateSchema.safeParse(json)
  if (!parsed.success) return NextResponse.json({ error: 'invalid_body' }, { status: 400 })

  const { fullKey, prefix, hash } = generateKey()
  const { error } = await supabase.from('api_keys').insert({
    user_id: user.id,
    name: parsed.data.name,
    prefix,
    hash,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  trackFunnelEventSoon({
    eventName: 'api_key_created',
    userId: user.id,
    email: user.email,
    source: 'dashboard_keys',
    properties: { keyName: parsed.data.name, prefix },
    notify: true,
  })
  return NextResponse.json({ key: fullKey, prefix })
}
