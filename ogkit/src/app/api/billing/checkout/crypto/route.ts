/**
 * GET /api/billing/checkout/crypto?plan=pro|scale
 * Creates a Cryptomus invoice and redirects to the payment page.
 */
import { type NextRequest, NextResponse } from 'next/server'
import { isCryptoBillingLive, cryptoBillingNotConfiguredBody } from '@/config/billing'
import { createClient } from '@/lib/supabase/server'
import { createPaymentInvoice } from '@/lib/cryptomus'
import { insertCryptoBillingOrder } from '@/lib/crypto-billing-orders'
import { PLANS } from '@/config/plans'
import { publicBasePath, withBasePath } from '@/config/paths'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function appBasePath(request: NextRequest): string {
  const o = request.nextUrl.origin
  return `${o}${publicBasePath || ''}`.replace(/\/$/, '')
}

function generateOrderId(plan: string): string {
  const t = Date.now().toString(36)
  const r = Math.random().toString(36).slice(2, 10)
  return `ogk-${plan}-${t}-${r}`.replace(/[^a-zA-Z0-9_-]/g, '-')
}

export async function GET(request: NextRequest) {
  if (!isCryptoBillingLive()) {
    return NextResponse.json(cryptoBillingNotConfiguredBody(), { status: 503 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const planParam = request.nextUrl.searchParams.get('plan')
  const plan = planParam === 'pro' || planParam === 'scale' ? planParam : null

  if (!plan) {
    return NextResponse.redirect(new URL(withBasePath('/pricing'), request.url), 302)
  }

  if (!user?.id) {
    const returnPath = `/api/billing/checkout/crypto?plan=${encodeURIComponent(plan)}`
    return NextResponse.redirect(
      new URL(`${withBasePath('/login')}?${new URLSearchParams({ next: returnPath }).toString()}`, request.url),
      302,
    )
  }

  const p = PLANS[plan]
  const price = p.priceMonthly
  if (price <= 0) {
    return NextResponse.redirect(new URL(withBasePath('/pricing'), request.url), 302)
  }

  const base = appBasePath(request)
  const orderId = generateOrderId(plan)

  const result = await createPaymentInvoice({
    amount: price.toFixed(2),
    currency: 'USD',
    order_id: orderId,
    url_success: `${base}${withBasePath('/pricing/success')}?crypto=1&order_id=${encodeURIComponent(orderId)}`,
    url_return: `${base}${withBasePath('/pricing')}`,
    url_callback: `${base}${withBasePath('/api/billing/cryptomus/webhook')}`,
    additional_data: plan,
  })

  if (!result) {
    console.error('[conv] crypto_checkout_error', { reason: 'invoice_failed', userId: user.id, plan })
    return NextResponse.redirect(new URL(withBasePath('/pricing'), request.url), 302)
  }

  // Keep the same id as in url_success / Cryptomus request (ciple pattern).
  const inserted = await insertCryptoBillingOrder(orderId, plan, user.id)
  if (!inserted) {
    console.error('[conv] crypto_checkout_error', { reason: 'order_persist', userId: user.id, orderId })
    return new NextResponse('Unable to create order. Please try again shortly.', { status: 503 })
  }

  return NextResponse.redirect(result.url, 302)
}
