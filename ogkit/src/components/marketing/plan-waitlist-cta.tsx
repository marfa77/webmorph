'use client'

import { useState } from 'react'
import { getApiUrl } from '@/config/paths'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PLANS, type Plan } from '@/config/plans'

type PaidPlan = Extract<Plan, 'pro' | 'scale'>

type Props = { planId: PaidPlan }

export function PlanWaitlistCta({ planId }: Props) {
  const p = PLANS[planId]
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const company = (e.currentTarget.elements.namedItem('company') as HTMLInputElement | null)?.value
    if (company) {
      setStatus('done')
      return
    }
    setStatus('loading')
    const r = await fetch(getApiUrl('/api/waitlist'), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, plan: planId }),
    })
    if (r.ok) setStatus('done')
    else setStatus('error')
  }

  if (status === 'done') {
    return (
      <p className="text-center text-sm text-muted-foreground">
        You’re on the list. We’ll email you when {p.name} checkout is available.
      </p>
    )
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="relative w-full space-y-2">
      <p className="text-center text-xs text-muted-foreground">
        Paid checkout isn’t live yet. Leave your email to get notified.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          type="email"
          required
          name="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" className="shrink-0" disabled={status === 'loading'}>
          {status === 'loading' ? '…' : 'Notify me'}
        </Button>
      </div>
      <input
        type="text"
        name="company"
        tabIndex={-1}
        className="absolute h-0 w-0 overflow-hidden p-0 opacity-0"
        autoComplete="off"
        aria-hidden
      />
      {status === 'error' && <p className="text-center text-xs text-destructive">Something went wrong. Try again.</p>}
    </form>
  )
}
