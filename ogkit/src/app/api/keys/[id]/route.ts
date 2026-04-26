import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

type RouteContext = { params: { id: string } }

const UpdateSchema = z.object({
  allowedDomains: z
    .array(
      z
        .string()
        .trim()
        .toLowerCase()
        .regex(/^[a-z0-9.-]+$/),
    )
    .max(10)
    .optional(),
  requireSignedUrls: z.boolean().optional(),
})

export async function PATCH(req: Request, context: RouteContext) {
  const { id } = context.params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const json = await req.json().catch(() => ({}))
  const parsed = UpdateSchema.safeParse(json)
  if (!parsed.success) return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  const update: { allowed_domains?: string[]; require_signed_urls?: boolean } = {}
  if (parsed.data.allowedDomains) update.allowed_domains = parsed.data.allowedDomains
  if (typeof parsed.data.requireSignedUrls === 'boolean') update.require_signed_urls = parsed.data.requireSignedUrls
  if (Object.keys(update).length === 0) return NextResponse.json({ ok: true })

  const { error } = await supabase
    .from('api_keys')
    .update(update)
    .eq('id', id)
    .eq('user_id', user.id)
    .is('revoked_at', null)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_: Request, context: RouteContext) {
  const { id } = context.params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { error } = await supabase
    .from('api_keys')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
