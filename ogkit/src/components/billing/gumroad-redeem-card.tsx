'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { getApiUrl, withBasePath } from '@/config/paths'
import { getGumroadCheckoutUrl } from '@/config/gumroad'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function GumroadRedeemCard() {
  const [licenseKey, setLicenseKey] = useState('')
  const [loading, setLoading] = useState(false)
  const checkoutUrl = getGumroadCheckoutUrl()

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const key = licenseKey.trim()
    if (!key) {
      toast.error('Enter your license key.')
      return
    }
    setLoading(true)
    try {
      const r = await fetch(getApiUrl('/api/billing/gumroad/redeem'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseKey: key }),
      })
      const data = (await r.json().catch(() => ({}))) as {
        error?: string
        ok?: boolean
        alreadyRedeemed?: boolean
        cryptoPaidUntil?: string | null
      }
      if (!r.ok) {
        toast.error(data.error || 'Redemption failed.')
        return
      }
      const until =
        data.cryptoPaidUntil != null
          ? ` Paid access through ${new Date(data.cryptoPaidUntil).toLocaleDateString()}.`
          : ''
      if (data.alreadyRedeemed) {
        toast.success(`This license is already linked to your account.${until}`)
      } else {
        toast.success(`Pro access activated from your Gumroad license.${until}`)
      }
      setLicenseKey('')
    } catch {
      toast.error('Network error. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card id="gumroad">
      <CardHeader>
        <CardTitle>Redeem Gumroad license</CardTitle>
        <CardDescription>
          Purchased OGKit Pro on Gumroad? Paste the license key from your receipt. Each key can only be linked once.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          <a href={checkoutUrl} className="font-medium text-primary underline" target="_blank" rel="noopener noreferrer">
            Buy on Gumroad
          </a>{' '}
          (opens checkout), then redeem here while signed in.
        </p>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="gumroad-license">License key</Label>
            <Input
              id="gumroad-license"
              name="licenseKey"
              autoComplete="off"
              placeholder="XXXX-XXXX-XXXX-XXXX"
              value={licenseKey}
              onChange={(e) => setLicenseKey(e.target.value)}
              disabled={loading}
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? 'Verifying…' : 'Redeem'}
          </Button>
        </form>
        <p className="text-xs text-muted-foreground">
          Prefer crypto?{' '}
          <Link href={withBasePath('/pricing')} className="underline">
            Cryptomus checkout
          </Link>
          .
        </p>
      </CardContent>
    </Card>
  )
}
