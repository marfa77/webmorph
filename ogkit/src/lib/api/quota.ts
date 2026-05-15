import { and, count, eq, gte } from 'drizzle-orm'
import { db } from '@/lib/db'
import { usageEvents } from '@/lib/db/schema'
import { PLANS, type Plan } from '@/config/plans'

export async function checkQuota(
  userId: string,
  plan: Plan,
): Promise<{ ok: true } | { ok: false; cap: number; period: 'month' | 'day' }> {
  const limits = PLANS[plan]

  const startMonth = new Date()
  startMonth.setDate(1)
  startMonth.setHours(0, 0, 0, 0)

  const [monthRes] = await db
    .select({ c: count() })
    .from(usageEvents)
    .where(and(eq(usageEvents.userId, userId), gte(usageEvents.createdAt, startMonth)))

  if ((monthRes?.c ?? 0) >= limits.monthlyCap) {
    return { ok: false, cap: limits.monthlyCap, period: 'month' }
  }

  if (limits.dailyCap) {
    const startDay = new Date()
    startDay.setHours(0, 0, 0, 0)
    const [dayRes] = await db
      .select({ c: count() })
      .from(usageEvents)
      .where(and(eq(usageEvents.userId, userId), gte(usageEvents.createdAt, startDay)))

    if ((dayRes?.c ?? 0) >= limits.dailyCap) {
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
  const [prior] = await db.select({ c: count() }).from(usageEvents).where(eq(usageEvents.userId, e.userId))

  await db.insert(usageEvents).values({
    userId: e.userId,
    apiKeyId: e.apiKeyId,
    template: e.template,
    cacheHit: e.cacheHit,
    status: e.status,
  })

  return { isFirstUsage: (prior?.c ?? 0) === 0 }
}
