import { NextResponse } from 'next/server'
import { billingNotConfiguredBody, isBillingLive } from '@/config/billing'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST() {
  if (!isBillingLive()) {
    return NextResponse.json(billingNotConfiguredBody(), { status: 503 })
  }
  return NextResponse.json({ error: 'not_implemented' }, { status: 501 })
}
