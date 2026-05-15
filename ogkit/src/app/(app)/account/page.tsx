import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { withBasePath } from '@/config/paths'
import { signOut } from '@/lib/auth/signout'
import { PLANS } from '@/config/plans'
import { isCryptoBillingLive } from '@/config/billing'
import { isGumroadRedeemConfigured } from '@/config/gumroad'
import { getResolvedUserPlanForUserId } from '@/lib/billing/effective-plan'
import { GumroadRedeemCard } from '@/components/billing/gumroad-redeem-card'
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
  const session = await auth()
  if (!session?.user?.id) redirect(withBasePath('/login'))

  const plan = await getResolvedUserPlanForUserId(session.user.id)
  const planLabel = PLANS[plan].name

  return (
    <div className="container max-w-2xl space-y-6 py-8">
      <div>
        <h1 className="text-2xl font-bold">Account</h1>
        {session.user.email && <p className="mt-1 text-sm text-muted-foreground">Signed in as {session.user.email}</p>}
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

      <GumroadRedeemCard redeemConfigured={isGumroadRedeemConfigured()} />

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
