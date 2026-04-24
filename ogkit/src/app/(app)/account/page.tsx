import Link from 'next/link'
import { redirect } from 'next/navigation'
import { siteConfig } from '@/config/site'
import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/lib/auth/signout'
import { PLANS } from '@/config/plans'
import { isBillingLive, isCryptoBillingLive } from '@/config/billing'
import { getResolvedUserPlanForUserId } from '@/lib/billing/effective-plan'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata = { title: `Account — ${siteConfig.name}` }

export default async function AccountPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

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
            {isBillingLive()
              ? 'Manage subscription in the app when card checkout is connected.'
              : isCryptoBillingLive()
                ? 'Pro and Scale are available with crypto (Cryptomus) from the pricing page. Card checkout is coming when Lemon Squeezy is fully wired.'
                : 'Paid plans will be available with checkout. Until then, everyone uses the free tier (with waitlist for Pro / Scale on the pricing page).'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">Current: </span>
            <span className="font-medium">{planLabel}</span>
          </p>
          <p>
            <Link href="/pricing" className="text-primary underline">
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
            <Link href="/dashboard/keys">API keys</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/playground">Playground</Link>
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
