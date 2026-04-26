import Link from 'next/link'
import { withBasePath } from '@/config/paths'
import { siteConfig } from '@/config/site'
import { createClient } from '@/lib/supabase/server'
import { PLANS, type Plan } from '@/config/plans'
import { isCryptoBillingLive } from '@/config/billing'
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
  let usageCount: number | null = null
  let usageCap: number | null = null
  if (user) {
    const plan = await getResolvedUserPlanForUserId(user.id)
    planLabel = PLANS[plan as Plan].name
    usageCap = PLANS[plan as Plan].monthlyCap
    const startMonth = new Date()
    startMonth.setDate(1)
    startMonth.setHours(0, 0, 0, 0)
    const { count } = await supabase
      .from('usage_events')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', startMonth.toISOString())
    usageCount = count ?? 0
  }

  return (
    <div className="container max-w-4xl space-y-6 py-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        {user?.email && <p className="mt-1 text-sm text-muted-foreground">Signed in as {user.email}</p>}
        {planLabel && (
          <p className="mt-0.5 text-sm text-muted-foreground">
            Plan: <span className="text-foreground">{planLabel}</span>
            {isCryptoBillingLive() ? ' · Crypto checkout enabled' : ' · Pro / Scale: join waitlist on the pricing page'}
            {' · '}
            <Link className="underline" href={withBasePath('/account')}>
              Account
            </Link>
          </p>
        )}
        {usageCount !== null && usageCap !== null && (
          <p className="mt-1 text-sm text-muted-foreground">
            Monthly usage: <span className="text-foreground">{usageCount.toLocaleString()} / {usageCap.toLocaleString()}</span> generated images
          </p>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <NavCard
          href={withBasePath('/dashboard/keys')}
          title="API keys"
          desc="Create, revoke, sign, and domain-restrict keys. Use the full secret in the key= query or Authorization header."
          hint="Open →"
        />
        <NavCard
          href={withBasePath('/playground')}
          title="Playground"
          desc="Choose a template, set fields, and preview a real OG image."
          hint="Open →"
        />
        <NavCard href={withBasePath('/docs')} title="API reference" desc="Endpoints, query parameters, and template slugs for your stack." hint="Read docs →" />
        <NavCard
          href={withBasePath('/pricing')}
          title="Pricing & limits"
          desc="Free tier, Pro, Scale. Paid checkout is crypto-native when enabled."
          hint="View →"
        />
      </div>
    </div>
  )
}
