import { createAdminClient } from '@/lib/supabase/admin'
import type { PlanTier } from '@/lib/supabase/database.types'

export type CryptoBillingOrderStatus = 'pending' | 'paid'

export interface CryptoBillingOrder {
  order_id: string
  user_id: string
  plan: 'pro' | 'scale'
  status: CryptoBillingOrderStatus
  created_at: string
  updated_at: string
}

export async function insertCryptoBillingOrder(
  orderId: string,
  plan: 'pro' | 'scale',
  userId: string,
): Promise<CryptoBillingOrder | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('crypto_billing_orders')
    .insert({ order_id: orderId, plan, status: 'pending', user_id: userId })
    .select()
    .single()
  if (error) {
    console.warn('[crypto-billing-orders] insert error:', error)
    return null
  }
  return data as CryptoBillingOrder
}

export async function getCryptoBillingOrderByOrderId(orderId: string): Promise<CryptoBillingOrder | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase.from('crypto_billing_orders').select('*').eq('order_id', orderId).maybeSingle()
  if (error) {
    console.warn('[crypto-billing-orders] select error:', error)
    return null
  }
  return (data as CryptoBillingOrder) ?? null
}

const MS_PER_DAY = 86_400_000
const CRYPTO_BILLING_PERIOD_DAYS = 30

/**
 * Mark order paid and extend pro/scale access. Stacks from current end when still valid.
 */
export async function completeCryptoOrderFromWebhook(orderId: string): Promise<boolean> {
  const supabase = createAdminClient()
  const order = await getCryptoBillingOrderByOrderId(orderId)
  if (!order) {
    return false
  }
  if (order.status === 'paid') {
    return true
  }

  const { data: userRow, error: userErr } = await supabase
    .from('users')
    .select('crypto_paid_until, plan')
    .eq('id', order.user_id)
    .maybeSingle()
  if (userErr || !userRow) {
    console.warn('[crypto-billing-orders] user lookup error:', userErr)
    return false
  }

  const now = Date.now()
  const currentEnd = userRow.crypto_paid_until ? new Date(userRow.crypto_paid_until).getTime() : 0
  const base = (currentEnd > now ? currentEnd : now) + CRYPTO_BILLING_PERIOD_DAYS * MS_PER_DAY
  const cryptoPaidUntil = new Date(base).toISOString()

  const { error: updUser } = await supabase
    .from('users')
    .update({ plan: order.plan as PlanTier, crypto_paid_until: cryptoPaidUntil })
    .eq('id', order.user_id)

  if (updUser) {
    console.warn('[crypto-billing-orders] user update error:', updUser)
    return false
  }

  const { error: updOrder } = await supabase
    .from('crypto_billing_orders')
    .update({ status: 'paid', updated_at: new Date().toISOString() })
    .eq('order_id', orderId)
  if (updOrder) {
    console.warn('[crypto-billing-orders] order update error:', updOrder)
    return false
  }
  return true
}
