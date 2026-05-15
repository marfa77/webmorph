import { and, eq, isNull } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { apiKeys } from '@/lib/db/schema'

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
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const json = await req.json().catch(() => ({}))
  const parsed = UpdateSchema.safeParse(json)
  if (!parsed.success) return NextResponse.json({ error: 'invalid_body' }, { status: 400 })

  const update: { allowedDomains?: string[]; requireSignedUrls?: boolean } = {}
  if (parsed.data.allowedDomains) update.allowedDomains = parsed.data.allowedDomains
  if (typeof parsed.data.requireSignedUrls === 'boolean') update.requireSignedUrls = parsed.data.requireSignedUrls
  if (Object.keys(update).length === 0) return NextResponse.json({ ok: true })

  try {
    await db
      .update(apiKeys)
      .set(update)
      .where(and(eq(apiKeys.id, id), eq(apiKeys.userId, session.user.id), isNull(apiKeys.revokedAt)))
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}

export async function DELETE(_: Request, context: RouteContext) {
  const { id } = context.params
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  try {
    await db
      .update(apiKeys)
      .set({ revokedAt: new Date() })
      .where(and(eq(apiKeys.id, id), eq(apiKeys.userId, session.user.id)))
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
