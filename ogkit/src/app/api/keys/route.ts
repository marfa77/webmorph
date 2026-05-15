import { NextResponse } from 'next/server'
import { desc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { apiKeys } from '@/lib/db/schema'
import { trackFunnelEventSoon } from '@/lib/analytics/funnel'
import { generateKey } from '@/lib/api/keys'

const CreateSchema = z.object({ name: z.string().min(1).max(64).default('default') })

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const data = await db
    .select({
      id: apiKeys.id,
      name: apiKeys.name,
      prefix: apiKeys.prefix,
      last_used_at: apiKeys.lastUsedAt,
      created_at: apiKeys.createdAt,
      revoked_at: apiKeys.revokedAt,
      allowed_domains: apiKeys.allowedDomains,
      require_signed_urls: apiKeys.requireSignedUrls,
    })
    .from(apiKeys)
    .where(eq(apiKeys.userId, session.user.id))
    .orderBy(desc(apiKeys.createdAt))

  const keys = data.map((k) => ({
    id: k.id,
    name: k.name,
    prefix: k.prefix,
    last_used_at: k.last_used_at?.toISOString() ?? null,
    created_at: k.created_at.toISOString(),
    revoked_at: k.revoked_at?.toISOString() ?? null,
    allowed_domains: k.allowed_domains,
    require_signed_urls: k.require_signed_urls,
  }))

  return NextResponse.json({ keys })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const json = await req.json().catch(() => ({}))
  const parsed = CreateSchema.safeParse(json)
  if (!parsed.success) return NextResponse.json({ error: 'invalid_body' }, { status: 400 })

  const { fullKey, prefix, hash } = generateKey()
  try {
    await db.insert(apiKeys).values({
      userId: session.user.id,
      name: parsed.data.name,
      prefix,
      hash,
      allowedDomains: [],
      requireSignedUrls: false,
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }

  trackFunnelEventSoon({
    eventName: 'api_key_created',
    userId: session.user.id,
    email: session.user.email,
    source: 'dashboard_keys',
    properties: { keyName: parsed.data.name, prefix },
    notify: true,
  })
  return NextResponse.json({ key: fullKey, prefix })
}
