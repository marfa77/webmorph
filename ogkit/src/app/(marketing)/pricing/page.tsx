import Link from 'next/link'
import { PLANS } from '@/config/plans'
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
    'OGKit Open Graph image API pricing: free watermarked tier, Pro $19/mo (100k images), Scale $99/mo (1M). Cryptomus crypto checkout, signed URLs included on paid plans, monthly quota with no auto-renew.',
  pathname: '/pricing',
})

const faq = [
  {
    q: 'Do I need a credit card?',
    a: 'No. OGKit uses Cryptomus for crypto checkout. You pay with any supported cryptocurrency — no card processor, no regional billing block, no subscription lock-in.',
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
          All payments are processed in cryptocurrency via Cryptomus and are <strong>non-refundable</strong> once the
          monthly quota has been activated. If you experience a technical failure on our end before quota is granted,
          use our <Link href={withBasePath('/contact')} className="underline hover:text-foreground">contact form</Link> within 7 days and we will investigate.
        </p>
        <p>
          Subscriptions are one-time monthly payments — there is no automatic renewal. You pay again when you need
          quota for the next month.
        </p>
        <p>
          Questions? Read the <Link href={withBasePath('/terms')} className="underline hover:text-foreground">Terms of Service</Link> or{' '}
          <Link href={withBasePath('/contact')} className="underline hover:text-foreground">use the contact form</Link>.
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
