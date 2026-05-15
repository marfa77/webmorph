'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { withBasePath } from '@/config/paths'
import { siteConfig } from '@/config/site'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const authErrorByReason: Record<string, string> = {
  session:
    'This sign-in link has expired or was already used. Request a new magic link below.',
  link: 'Open the sign-in link from your email, or request a new code here.',
  provider: 'Sign-in was cancelled or did not complete. Please try again.',
}

const authErrorFallback = 'We could not sign you in. Request a new magic link below.'

export function LoginForm() {
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/dashboard'
  const urlAuth = searchParams.get('error')
  const reason = searchParams.get('reason')
  const authBanner = useMemo(() => {
    if (urlAuth !== 'auth') return null
    if (reason && authErrorByReason[reason]) return authErrorByReason[reason]
    return authErrorFallback
  }, [urlAuth, reason])

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErr(null)
    const origin = window.location.origin.replace(/\/$/, '')
    const nextPath = next.startsWith('/') ? next : `/${next}`
    const callbackUrl = `${origin}${withBasePath(nextPath)}`

    const result = await signIn('resend', { email, callbackUrl, redirect: false })
    setLoading(false)
    if (result?.error) setErr(result.error)
    else setSent(true)
  }

  return (
    <div className="container flex min-h-[70vh] max-w-lg items-center">
      <Card className="w-full">
        <CardHeader>
          <h1 className="text-2xl font-semibold leading-none tracking-tight">Sign in to {siteConfig.name}</h1>
          <CardDescription>Magic link. No password.</CardDescription>
        </CardHeader>
        <CardContent>
          {authBanner && (
            <p className="mb-4 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-foreground" role="alert">
              {authBanner}
            </p>
          )}
          {sent ? (
            <p className="text-sm">Check your email for the login link.</p>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
              {err && <p className="text-sm text-destructive">{err}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Sending...' : 'Send magic link'}
              </Button>
            </form>
          )}
          <p className="mt-4 text-center text-sm text-muted-foreground">
            <Link href={withBasePath('/')} className="underline">
              Back to home
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
