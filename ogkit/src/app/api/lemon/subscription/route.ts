import { NextResponse } from 'next/server'
import { isBillingLive } from '@/config/billing'

export async function GET() {
  if (!isBillingLive()) {
    return NextResponse.json({ subscription: null, billing: 'disabled' as const })
  }
  return NextResponse.json({ subscription: null, billing: 'ready' as const })
}
