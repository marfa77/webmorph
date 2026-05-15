/**
 * GET /api/billing/crypto-order?order_id= — success page polling (owner only)
 */
import { type NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getCryptoBillingOrderByOrderId } from '@/lib/crypto-billing-orders'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const orderId = request.nextUrl.searchParams.get('order_id')
  if (!orderId) {
    return NextResponse.json({ error: 'Missing order_id' }, { status: 400 })
  }

  const order = await getCryptoBillingOrderByOrderId(orderId)
  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }
  if (order.user_id !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.json({ status: order.status, plan: order.plan })
}
