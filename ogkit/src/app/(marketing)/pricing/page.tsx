import Link from 'next/link'
import { PLANS } from '@/config/plans'
import { getGumroadCheckoutUrl } from '@/config/gumroad'
import { absoluteSiteUrl, withBasePath } from '@/config/paths'
import { siteConfig } from '@/config/site'
import { marketingMetadata } from '@/lib/marketing-metadata'
import { breadcrumbListJsonLd } from '@/lib/breadcrumbs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export const metadata = marketingMetadata({
  title: 'Open Graph image API pricing — OGKit Free, Pro $19, Scale $99',
  description:
    'OGKit Open Graph image API pricing: free watermarked tier, Pro $19/mo (100k images), Scale $99/mo (1M). Pay by card (Gumroad) or crypto (Cryptomus). Signed URLs on paid plans, monthly quota with no auto-renew.',
  pathname: '/pricing',
})

const faq = [
  {
    q: 'Can I pay with a credit card?',
    a: 'Yes. OGKit Pro is available on Gumroad with card checkout. After purchase, sign in and redeem your license key on the account page. Scale is available via crypto checkout.',
  },
  {
    q: 'Do you support crypto?',
    a: 'Yes. Pro and Scale can be purchased with cryptocurrency via Cryptomus — useful if you prefer on-chain payment or cannot use card checkout in your region.',
  },
  {
    q: 'What is the free tier?',
    a: 'The free tier gives you 1,000 watermarked images per month and full access to demo=1 previews without an account. Watermarks are removed on Pro and Scale.',
  },
  {
    q: 'Is the subscription auto-renewing?',
    a: 'No. Each payment is a one-time monthly quota grant. You pay again at the start of the next month if you need more quota — there is no automatic renewal.',
  },
  {
    q: 'Can I use OGKit for multiple projects?',
    a: 'Yes. You can create multiple API keys per account and restrict each key to a specific domain or require signed URLs for extra security.',
  },
  {
    q: 'What happens when my quota runs out?',
    a: 'The API returns HTTP 429 once your monthly cap is reached. You can upgrade to a higher plan at any time to continue generating images.',
  },
  {
    q: 'Are payments refundable?',
    a: 'Payments are non-refundable once the monthly quota has been activated. If you experience a technical failure before quota is granted, contact us within 7 days.',
  },
]

export default function PricingPage() {
  const pricingRoot = absoluteSiteUrl('/pricing')
  const gumroadUrl = getGumroadCheckoutUrl()
  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `${siteConfig.name} Open Graph image API`,
    description: siteConfig.description,
    url: pricingRoot,
    offers: [
      {
        '@type': 'Offer',
        name: 'Free',
        price: '0',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
        url: pricingRoot,
        description: '1,000 watermarked images per month.',
      },
      {
        '@type': 'Offer',
        name: 'Pro',
        price: '19',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
        url: pricingRoot,
        description: '100,000 images per month, no watermark, signed URLs, Google Fonts.',
      },
      {
        '@type': 'Offer',
        name: 'Scale',
        price: '99',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
        url: pricingRoot,
        description: '1,000,000 images per month, priority CDN, no watermark.',
      },
    ],
  }
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  }
  const breadcrumbLd = breadcrumbListJsonLd([{ name: 'Pricing', path: '/pricing' }])

  return (
    <div className="container max-w-5xl py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <h1 className="text-center text-3xl font-bold">Pricing</h1>
      <p className="mt-2 text-center text-muted-foreground">
        Start with demo previews, then upgrade when you need production quota.
      </p>
      <p className="mx-auto mt-4 max-w-xl text-center text-sm text-muted-foreground">
        <span className="font-medium text-foreground">Pay your way.</span> Pro on Gumroad (card) or crypto. Scale via
        crypto. One-time monthly quota — no auto-renewal.
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
                ) : id === 'pro' ? (
                  <>
                    <Button asChild className="w-full">
                      <a href={gumroadUrl} target="_blank" rel="noopener noreferrer">
                        Buy Pro — card (Gumroad)
                      </a>
                    </Button>
                    <Button asChild className="w-full" variant="outline">
                      <a href={withBasePath('/api/billing/checkout/crypto?plan=pro')}>Pay with crypto</a>
                    </Button>
                    <p className="text-center text-xs text-muted-foreground">
                      Already bought on Gumroad?{' '}
                      <Link href={withBasePath('/account#gumroad')} className="underline hover:text-foreground">
                        Redeem license
                      </Link>
                    </p>
                  </>
                ) : (
                  <>
                    <Button asChild className="w-full">
                      <a href={withBasePath('/api/billing/checkout/crypto?plan=scale')}>Pay with crypto · Scale</a>
                    </Button>
                    <p className="text-center text-xs text-muted-foreground">
                      Need card checkout?{' '}
                      <a href={gumroadUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
                        Pro on Gumroad
                      </a>
                    </p>
                  </>
                )}
              </CardFooter>
            </Card>
          )
        })}
      </div>

      <section className="mt-12 rounded-lg border bg-muted/30 p-6 text-sm text-muted-foreground space-y-3">
        <p className="font-medium text-foreground">How checkout works</p>
        <ul className="list-inside list-disc space-y-1">
          <li>
            <strong className="text-foreground">Gumroad (Pro, card):</strong> checkout on Gumroad → sign in to OGKit →
            redeem license key on{' '}
            <Link href={withBasePath('/account#gumroad')} className="underline hover:text-foreground">
              account page
            </Link>
            .
          </li>
          <li>
            <strong className="text-foreground">Crypto (Pro &amp; Scale):</strong> pay via Cryptomus → quota activates
            after on-chain confirmation.
          </li>
        </ul>
      </section>

      <section className="mt-14 space-y-4">
        <h2 className="text-xl font-bold">What you get on every plan</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            ['10+ templates', 'Article, product, minimal, gradient, brand, dark-code, quote, podcast, event, job — all accessible on free and paid plans.'],
            ['demo=1 previews', 'Generate watermarked previews without an account for design validation, Cursor prompts, and CI checks.'],
            ['Stable HTTPS URLs', 'Deterministic image URLs work in any framework: Next.js, Astro, Remix, Rails, Django, Hugo, and static HTML.'],
          ].map(([t, c]) => (
            <div key={t} className="rounded-lg border p-5">
              <h3 className="font-semibold">{t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-12 rounded-lg border bg-muted/30 p-6 text-sm text-muted-foreground space-y-2">
        <p className="font-medium text-foreground">Payment & refund policy</p>
        <p>
          Gumroad and Cryptomus payments are <strong>non-refundable</strong> once the monthly quota has been activated.
          If you experience a technical failure on our end before quota is granted, use our{' '}
          <Link href={withBasePath('/contact')} className="underline hover:text-foreground">
            contact form
          </Link>{' '}
          within 7 days and we will investigate.
        </p>
        <p>
          Subscriptions are one-time monthly payments — there is no automatic renewal. You pay again when you need quota
          for the next month.
        </p>
        <p>
          Questions? Read the{' '}
          <Link href={withBasePath('/terms')} className="underline hover:text-foreground">
            Terms of Service
          </Link>{' '}
          or{' '}
          <Link href={withBasePath('/contact')} className="underline hover:text-foreground">
            use the contact form
          </Link>
          .
        </p>
      </div>

      <section className="mt-14 space-y-6">
        <h2 className="text-xl font-bold">Frequently asked questions</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          {faq.map((item) => (
            <div key={item.q} className="rounded-lg border p-5">
              <h3 className="font-semibold">{item.q}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
