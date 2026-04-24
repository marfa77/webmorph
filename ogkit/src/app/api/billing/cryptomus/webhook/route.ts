/**
 * POST /api/billing/cryptomus/webhook
 * https://doc.cryptomus.com/merchant-api/payments/webhook
 */
import { NextResponse } from 'next/server'
import { verifyWebhookSign } from '@/lib/cryptomus'
import { completeCryptoOrderFromWebhook } from '@/lib/crypto-billing-orders'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const PAID_STATUSES = ['paid', 'paid_over'] as const

export async function POST(request: Request) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const receivedSign = body.sign
  if (typeof receivedSign !== 'string') {
    return NextResponse.json({ error: 'Missing sign' }, { status: 400 })
  }

  if (!verifyWebhookSign(body, receivedSign)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const status = body.status
  const orderId = body.order_id
  if (typeof orderId !== 'string' || !orderId) {
    return NextResponse.json({ error: 'Missing order_id' }, { status: 400 })
  }

  if (PAID_STATUSES.includes(status as (typeof PAID_STATUSES)[number])) {
    const ok = await completeCryptoOrderFromWebhook(orderId)
    if (!ok) {
      return NextResponse.json({ error: 'Failed to apply payment' }, { status: 500 })
    }
  }

  return NextResponse.json({ ok: true })
}
