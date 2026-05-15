import { and, eq, inArray } from 'drizzle-orm'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import type { Plan } from '@/config/plans'
import type { PlanTier } from '@/lib/db/types'

/**
 * If paid access window expired, downgrades users.plan to free. Call from API key auth and similar.
 * `crypto_paid_until` is shared by Cryptomus crypto checkout and Gumroad Pro redemptions (both grant 30-day windows that stack).
 */
export async function resolvePlanAfterCryptoExpiry(
  userId: string,
  plan: PlanTier,
  cryptoPaidUntil: Date | null,
): Promise<Plan> {
  if (plan === 'free') return 'free'
  if (!cryptoPaidUntil) {
    return plan as Plan
  }
  const end = cryptoPaidUntil instanceof Date ? cryptoPaidUntil : new Date(cryptoPaidUntil)
  if (end >= new Date()) {
    return plan as Plan
  }
  try {
    await db
      .update(users)
      .set({ plan: 'free', cryptoPaidUntil: null, updatedAt: new Date() })
      .where(and(eq(users.id, userId), inArray(users.plan, ['pro', 'scale'])))
  } catch (e) {
    console.warn('[billing] crypto expiry update error:', e)
  }
  return 'free'
}

export async function getResolvedUserPlanForUserId(userId: string): Promise<Plan> {
  const [u] = await db
    .select({ plan: users.plan, cryptoPaidUntil: users.cryptoPaidUntil })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
  if (!u) return 'free'
  return resolvePlanAfterCryptoExpiry(userId, u.plan, u.cryptoPaidUntil ?? null)
}
