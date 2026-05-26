import { and, eq, isNull } from 'drizzle-orm'
import { generateKey } from '@/lib/api/keys'
import { trackFunnelEventSoon } from '@/lib/analytics/funnel'
import { db } from '@/lib/db'
import { apiKeys } from '@/lib/db/schema'

export type EnsureDefaultKeyResult =
  | { created: true; key: string; prefix: string }
  | { created: false; prefix: string | null }

export async function ensureDefaultApiKey(
  userId: string,
  opts?: { email?: string | null; source?: string },
): Promise<EnsureDefaultKeyResult> {
  const [existing] = await db
    .select({ prefix: apiKeys.prefix })
    .from(apiKeys)
    .where(and(eq(apiKeys.userId, userId), isNull(apiKeys.revokedAt)))
    .limit(1)

  if (existing) {
    return { created: false, prefix: existing.prefix }
  }

  const { fullKey, prefix, hash } = generateKey()
  await db.insert(apiKeys).values({
    userId,
    name: 'default',
    prefix,
    hash,
    allowedDomains: [],
    requireSignedUrls: false,
  })

  trackFunnelEventSoon({
    eventName: 'api_key_created',
    userId,
    email: opts?.email,
    source: opts?.source ?? 'bootstrap',
    properties: { keyName: 'default', prefix, auto: true },
    notify: true,
  })

  return { created: true, key: fullKey, prefix }
}
