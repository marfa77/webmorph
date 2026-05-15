import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { cryptoBillingOrders, users } from '@/lib/db/schema'
import type { PlanTier } from '@/lib/db/types'

export type CryptoBillingOrderStatus = 'pending' | 'paid'

export interface CryptoBillingOrder {
  order_id: string
  user_id: string
  plan: 'pro' | 'scale'
  status: CryptoBillingOrderStatus
  created_at: string
  updated_at: string
}

type CryptoRow = typeof cryptoBillingOrders.$inferSelect

function rowToOrder(row: CryptoRow): CryptoBillingOrder {
  return {
    order_id: row.orderId,
    user_id: row.userId,
    plan: row.plan,
    status: row.status,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
  }
}

export async function insertCryptoBillingOrder(
  orderId: string,
  plan: 'pro' | 'scale',
  userId: string,
): Promise<CryptoBillingOrder | null> {
  try {
    await db.insert(cryptoBillingOrders).values({
      orderId,
      plan,
      status: 'pending',
      userId,
    })
    const [row] = await db.select().from(cryptoBillingOrders).where(eq(cryptoBillingOrders.orderId, orderId)).limit(1)
    return row ? rowToOrder(row) : null
  } catch (e) {
    console.warn('[crypto-billing-orders] insert error:', e)
    return null
  }
}

export async function getCryptoBillingOrderByOrderId(orderId: string): Promise<CryptoBillingOrder | null> {
  try {
    const [row] = await db.select().from(cryptoBillingOrders).where(eq(cryptoBillingOrders.orderId, orderId)).limit(1)
    return row ? rowToOrder(row) : null
  } catch (e) {
    console.warn('[crypto-billing-orders] select error:', e)
    return null
  }
}

const MS_PER_DAY = 86_400_000
const CRYPTO_BILLING_PERIOD_DAYS = 30

/**
 * Mark order paid and extend pro/scale access. Stacks from current end when still valid.
 */
export async function completeCryptoOrderFromWebhook(orderId: string): Promise<boolean> {
  const order = await getCryptoBillingOrderByOrderId(orderId)
  if (!order) {
    return false
  }
  if (order.status === 'paid') {
    return true
  }

  const [userRow] = await db
    .select({ cryptoPaidUntil: users.cryptoPaidUntil, plan: users.plan })
    .from(users)
    .where(eq(users.id, order.user_id))
    .limit(1)
  if (!userRow) {
    console.warn('[crypto-billing-orders] user lookup error: not found')
    return false
  }

  const now = Date.now()
  const currentEnd = userRow.cryptoPaidUntil ? userRow.cryptoPaidUntil.getTime() : 0
  const base = (currentEnd > now ? currentEnd : now) + CRYPTO_BILLING_PERIOD_DAYS * MS_PER_DAY
  const cryptoPaidUntil = new Date(base)

  try {
    await db
      .update(users)
      .set({
        plan: order.plan as PlanTier,
        cryptoPaidUntil,
        updatedAt: new Date(),
      })
      .where(eq(users.id, order.user_id))

    await db
      .update(cryptoBillingOrders)
      .set({ status: 'paid', updatedAt: new Date() })
      .where(eq(cryptoBillingOrders.orderId, orderId))
  } catch (e) {
    console.warn('[crypto-billing-orders] update error:', e)
    return false
  }
  return true
}
