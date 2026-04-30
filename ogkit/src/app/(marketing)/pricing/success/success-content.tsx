'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { getApiUrl, withBasePath } from '@/config/paths'
import { siteConfig } from '@/config/site'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type PollState = { status: string; plan: string } | null

export function PricingSuccessContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('order_id')
  const isCrypto = searchParams.get('crypto') === '1' && orderId
  const [order, setOrder] = useState<PollState>(null)

  useEffect(() => {
    if (!isCrypto || !orderId) return
    let cancelled = false
    let attempts = 0
    const maxAttempts = 22
    const interval = 4000

    const poll = async () => {
      try {
        const u = getApiUrl(`/api/billing/crypto-order?order_id=${encodeURIComponent(orderId)}`)
        const r = await fetch(u)
        if (!r.ok || cancelled) return
        const data = (await r.json()) as { status?: string; plan?: string }
        if (cancelled) return
        if (data?.status) {
          setOrder({ status: data.status, plan: data.plan ?? 'pro' })
        }
        if (data?.status === 'paid') return
      } catch {
        /* ignore */
      }
      attempts += 1
      if (!cancelled && attempts < maxAttempts) {
        setTimeout(poll, interval)
      }
    }
    poll()
    return () => {
      cancelled = true
    }
  }, [isCrypto, orderId])

  const paid = order?.status === 'paid'

  return (
    <Card>
      <CardHeader>
        <CardTitle>Thanks</CardTitle>
        <CardDescription>
          {isCrypto
            ? paid
              ? 'Your crypto payment is confirmed. Your plan is active.'
              : 'Confirming your payment… This usually takes under a minute.'
            : 'Your purchase is being processed. You can return to the app below.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-muted-foreground">
          {isCrypto && order && !paid && <p>Status: {order.status}</p>}
          {isCrypto && paid && order && (
            <p>
              <span className="text-foreground">Active plan: {order.plan === 'scale' ? 'Scale' : 'Pro'}</span>
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Link href={withBasePath('/dashboard')} className="text-primary underline">
              Open dashboard
            </Link>
            <span>·</span>
            <Link href={withBasePath('/')} className="text-primary underline">
              {siteConfig.name} home
            </Link>
          </div>
      </CardContent>
    </Card>
  )
}
