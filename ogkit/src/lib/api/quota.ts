import { createAdminClient } from '@/lib/supabase/admin'
import { PLANS, type Plan } from '@/config/plans'

export async function checkQuota(
  userId: string,
  plan: Plan,
): Promise<{ ok: true } | { ok: false; cap: number; period: 'month' | 'day' }> {
  const supabase = createAdminClient()
  const limits = PLANS[plan]

  const startMonth = new Date()
  startMonth.setDate(1)
  startMonth.setHours(0, 0, 0, 0)

  const { count: monthCount } = await supabase
    .from('usage_events')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', startMonth.toISOString())

  if ((monthCount ?? 0) >= limits.monthlyCap) {
    return { ok: false, cap: limits.monthlyCap, period: 'month' }
  }

  if (limits.dailyCap) {
    const startDay = new Date()
    startDay.setHours(0, 0, 0, 0)
    const { count: dayCount } = await supabase
      .from('usage_events')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', startDay.toISOString())

    if ((dayCount ?? 0) >= limits.dailyCap) {
      return { ok: false, cap: limits.dailyCap, period: 'day' }
    }
  }

  return { ok: true }
}

export async function recordUsage(e: {
  userId: string
  apiKeyId: string
  template: string
  cacheHit: boolean
  status: number
}): Promise<{ isFirstUsage: boolean }> {
  const supabase = createAdminClient()
  const { count } = await supabase
    .from('usage_events')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', e.userId)

  await supabase.from('usage_events').insert({
    user_id: e.userId,
    api_key_id: e.apiKeyId,
    template: e.template,
    cache_hit: e.cacheHit,
    status: e.status,
  })

  return { isFirstUsage: (count ?? 0) === 0 }
}
