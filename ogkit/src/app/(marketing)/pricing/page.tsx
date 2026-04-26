import Link from 'next/link'
import { PLANS } from '@/config/plans'
import { isCryptoBillingLive } from '@/config/billing'
import { withBasePath } from '@/config/paths'
import { siteConfig } from '@/config/site'
import { PlanWaitlistCta } from '@/components/marketing/plan-waitlist-cta'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export const metadata = { title: `Pricing — ${siteConfig.name}` }

export default function PricingPage() {
  const crypto = isCryptoBillingLive()
  return (
    <div className="container max-w-5xl py-16">
      <h1 className="text-center text-3xl font-bold">Crypto-native pricing</h1>
      <p className="mt-2 text-center text-muted-foreground">
        Start with demo previews, then pay globally with crypto when you need production quota.
      </p>
      {!crypto && (
        <p className="mx-auto mt-4 max-w-lg text-center text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Crypto checkout is not configured in this environment.</span> The
          free tier, API, and Playground work in full. Leave your email on Pro or Scale to be notified when checkout opens.
        </p>
      )}
      {crypto && (
        <p className="mx-auto mt-4 max-w-lg text-center text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Crypto-only by design.</span> OGKit uses Cryptomus for global
          developer checkout without card processors, regional billing blocks, or subscription lock-in.
        </p>
      )}
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {(['free', 'pro', 'scale'] as const).map((id) => {
          const p = PLANS[id]
          return (
            <Card key={id} className={id === 'pro' ? 'border-primary' : ''}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{p.name}</CardTitle>
                  {id === 'pro' && <Badge>Popular</Badge>}
                </div>
                <CardDescription>
                  {p.priceMonthly === 0 ? 'For side projects' : `$${p.priceMonthly}/month`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {p.features.map((f) => (
                    <li key={f}>• {f}</li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="flex flex-col gap-2">
                {id === 'free' ? (
                  <Button asChild className="w-full" variant="outline">
                    <Link href={withBasePath('/login')}>Get started</Link>
                  </Button>
                ) : (
                  <>
                    {crypto ? (
                      <Button asChild className="w-full">
                        <a href={withBasePath(`/api/billing/checkout/crypto?plan=${id}`)}>Pay with crypto · {p.name}</a>
                      </Button>
                    ) : null}
                    {!crypto ? <PlanWaitlistCta planId={id} /> : null}
                  </>
                )}
              </CardFooter>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
