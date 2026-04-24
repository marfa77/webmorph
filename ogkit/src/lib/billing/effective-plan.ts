import { createAdminClient } from '@/lib/supabase/admin'
import type { Plan } from '@/config/plans'
import type { PlanTier } from '@/lib/supabase/database.types'

/**
 * If crypto access expired, downgrades users.plan to free. Call from API key auth and similar.
 */
export async function resolvePlanAfterCryptoExpiry(
  userId: string,
  plan: PlanTier,
  cryptoPaidUntil: string | null,
): Promise<Plan> {
  if (plan === 'free') return 'free'
  if (!cryptoPaidUntil) {
    // Lemon (when wired) or legacy rows without a crypto window
    return plan as Plan
  }
  const end = new Date(cryptoPaidUntil)
  if (end >= new Date()) {
    return plan as Plan
  }
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('users')
    .update({ plan: 'free', crypto_paid_until: null, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .in('plan', ['pro', 'scale'])
  if (error) {
    console.warn('[billing] crypto expiry update error:', error)
  }
  return 'free'
}

export async function getResolvedUserPlanForUserId(userId: string): Promise<Plan> {
  const supabase = createAdminClient()
  const { data: u } = await supabase.from('users').select('plan, crypto_paid_until').eq('id', userId).maybeSingle()
  if (!u) return 'free'
  return resolvePlanAfterCryptoExpiry(userId, u.plan, u.crypto_paid_until)
}
