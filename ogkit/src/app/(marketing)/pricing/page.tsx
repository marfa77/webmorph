import Link from 'next/link'
import { PLANS } from '@/config/plans'
import { withBasePath } from '@/config/paths'
import { siteConfig } from '@/config/site'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export const metadata = {
  title: `Pricing — ${siteConfig.name}`,
  alternates: { canonical: `${siteConfig.url}/pricing` },
}

export default function PricingPage() {
  return (
    <div className="container max-w-5xl py-16">
      <h1 className="text-center text-3xl font-bold">Crypto-native pricing</h1>
      <p className="mt-2 text-center text-muted-foreground">
        Start with demo previews, then pay globally with crypto when you need production quota.
      </p>
      <p className="mx-auto mt-4 max-w-lg text-center text-sm text-muted-foreground">
        <span className="font-medium text-foreground">Crypto-only by design.</span> OGKit uses Cryptomus for global
        developer checkout without card processors, regional billing blocks, or subscription lock-in.
      </p>
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
                    <Link href={withBasePath('/login')}>Get started free</Link>
                  </Button>
                ) : (
                  <Button asChild className="w-full">
                    <a href={withBasePath(`/api/billing/checkout/crypto?plan=${id}`)}>Pay with crypto · {p.name}</a>
                  </Button>
                )}
              </CardFooter>
            </Card>
          )
        })}
      </div>

      <div className="mt-12 rounded-lg border bg-muted/30 p-6 text-sm text-muted-foreground space-y-2">
        <p className="font-medium text-foreground">Payment & refund policy</p>
        <p>
          All payments are processed in cryptocurrency via Cryptomus and are <strong>non-refundable</strong> once the
          monthly quota has been activated. If you experience a technical failure on our end before quota is granted,
          use our <a href="/contact" className="underline hover:text-foreground">contact form</a> within 7 days and we will investigate.
        </p>
        <p>
          Subscriptions are one-time monthly payments — there is no automatic renewal. You pay again when you need
          quota for the next month.
        </p>
        <p>
          Questions? Read the <Link href={withBasePath('/terms')} className="underline hover:text-foreground">Terms of Service</Link> or
          {' '}<Link href={withBasePath('/contact')} className="underline hover:text-foreground">use the contact form</Link>.
        </p>
      </div>
    </div>
  )
}
