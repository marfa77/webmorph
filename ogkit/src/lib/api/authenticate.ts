import { and, eq, isNull } from 'drizzle-orm'
import { db } from '@/lib/db'
import { apiKeys, users } from '@/lib/db/schema'
import { getResolvedUserPlanForUserId } from '@/lib/billing/effective-plan'
import { extractPrefix, verifyKey } from './keys'

export type AuthResult =
  | {
      ok: true
      userId: string
      userEmail: string
      apiKeyId: string
      plan: 'free' | 'pro' | 'scale'
      watermark: boolean
      allowedDomains: string[]
      requireSignedUrls: boolean
      rawKey: string
    }
  | { ok: false; status: number; error: string }

export async function authenticateKey(key: string | null): Promise<AuthResult> {
  if (!key) return { ok: false, status: 401, error: 'missing_key' }

  const prefix = extractPrefix(key)
  if (!prefix) return { ok: false, status: 401, error: 'invalid_key_format' }

  const [keyRow] = await db
    .select()
    .from(apiKeys)
    .where(and(eq(apiKeys.prefix, prefix), isNull(apiKeys.revokedAt)))
    .limit(1)

  if (!keyRow) return { ok: false, status: 401, error: 'key_not_found' }
  if (!verifyKey(key, keyRow.hash)) return { ok: false, status: 401, error: 'key_invalid' }

  const [userRow] = await db.select({ id: users.id, email: users.email }).from(users).where(eq(users.id, keyRow.userId)).limit(1)
  if (!userRow) return { ok: false, status: 401, error: 'user_not_found' }

  const plan = await getResolvedUserPlanForUserId(keyRow.userId)

  void db.update(apiKeys).set({ lastUsedAt: new Date() }).where(eq(apiKeys.id, keyRow.id))

  const allowedDomains = Array.isArray(keyRow.allowedDomains) ? keyRow.allowedDomains : []

  return {
    ok: true,
    userId: keyRow.userId,
    userEmail: userRow.email,
    apiKeyId: keyRow.id,
    plan,
    watermark: plan === 'free',
    allowedDomains,
    requireSignedUrls: keyRow.requireSignedUrls ?? false,
    rawKey: key,
  }
}
