import Link from 'next/link'
import { redirect } from 'next/navigation'
import { withBasePath } from '@/config/paths'
import { siteConfig } from '@/config/site'
import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/lib/auth/signout'
import { PLANS } from '@/config/plans'
import { isCryptoBillingLive } from '@/config/billing'
import { getResolvedUserPlanForUserId } from '@/lib/billing/effective-plan'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { privateAppMetadata } from '@/lib/app-route-metadata'

export const metadata = privateAppMetadata({
  title: 'OGKit account — plan, billing, Cryptomus & API keys',
  description:
    'Your OGKit account: current plan, crypto billing through Cryptomus, monthly image quota, and shortcuts to API keys and dashboard usage. Sign in required.',
  pathname: '/account',
})

export default async function AccountPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(withBasePath('/login'))

  const plan = await getResolvedUserPlanForUserId(user.id)
  const planLabel = PLANS[plan].name

  return (
    <div className="container max-w-2xl space-y-6 py-8">
      <div>
        <h1 className="text-2xl font-bold">Account</h1>
        {user.email && <p className="mt-1 text-sm text-muted-foreground">Signed in as {user.email}</p>}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Plan</CardTitle>
          <CardDescription>
            {isCryptoBillingLive()
              ? 'Pro and Scale are available through crypto checkout on the pricing page.'
              : 'Crypto checkout is not configured in this environment. Until then, everyone uses the free tier with waitlist access for Pro and Scale.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">Current: </span>
            <span className="font-medium">{planLabel}</span>
          </p>
          <p>
            <Link href={withBasePath('/pricing')} className="text-primary underline">
              View pricing
            </Link>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>API keys & usage</CardTitle>
          <CardDescription>Create keys in the dashboard and use them with the OG image API.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href={withBasePath('/dashboard/keys')}>API keys</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href={withBasePath('/playground')}>Playground</Link>
          </Button>
        </CardContent>
      </Card>

      <form action={signOut} className="pt-2">
        <Button type="submit" variant="outline" size="sm">
          Sign out
        </Button>
      </form>
    </div>
  )
}
