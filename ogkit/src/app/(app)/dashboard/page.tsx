import Link from 'next/link'
import { siteConfig } from '@/config/site'
import { createClient } from '@/lib/supabase/server'
import { PLANS, type Plan } from '@/config/plans'
import { isBillingLive, isCryptoBillingLive } from '@/config/billing'
import { getResolvedUserPlanForUserId } from '@/lib/billing/effective-plan'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata = { title: `Dashboard — ${siteConfig.name}` }

function NavCard({
  href,
  title,
  desc,
  hint,
}: {
  href: string
  title: string
  desc: string
  hint?: string
}) {
  return (
    <Link href={href}>
      <Card className="h-full transition-colors hover:bg-muted/50">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{desc}</CardDescription>
        </CardHeader>
        {hint && (
          <CardContent>
            <span className="text-sm font-medium text-primary">{hint}</span>
          </CardContent>
        )}
      </Card>
    </Link>
  )
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let planLabel: string | null = null
  if (user) {
    const plan = await getResolvedUserPlanForUserId(user.id)
    planLabel = PLANS[plan as Plan].name
  }

  return (
    <div className="container max-w-4xl space-y-6 py-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        {user?.email && <p className="mt-1 text-sm text-muted-foreground">Signed in as {user.email}</p>}
        {planLabel && (
          <p className="mt-0.5 text-sm text-muted-foreground">
            Plan: <span className="text-foreground">{planLabel}</span>
            {isBillingLive() || isCryptoBillingLive() ? null : ' · Pro / Scale: join waitlist on the pricing page'}
            {' · '}
            <Link className="underline" href="/account">
              Account
            </Link>
          </p>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <NavCard
          href="/dashboard/keys"
          title="API keys"
          desc="Create and revoke keys. Use the full secret in the key= query or Authorization header."
          hint="Open →"
        />
        <NavCard
          href="/playground"
          title="Playground"
          desc="Choose a template, set fields, and preview a real OG image."
          hint="Open →"
        />
        <NavCard href="/docs" title="API reference" desc="Endpoints, query parameters, and template slugs for your stack." hint="Read docs →" />
        <NavCard
          href="/pricing"
          title="Pricing & limits"
          desc="Free tier, Pro, Scale. Paid checkout: waitlist until enabled."
          hint="View →"
        />
      </div>
    </div>
  )
}
