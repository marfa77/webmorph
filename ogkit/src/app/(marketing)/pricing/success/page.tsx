import { Suspense } from 'react'
import { siteConfig } from '@/config/site'
import { marketingMetadata } from '@/lib/marketing-metadata'
import { PricingSuccessContent } from './success-content'

const base = marketingMetadata({
  title: 'OGKit checkout — crypto payment status after Cryptomus',
  description:
    'Return page after Cryptomus: we poll your order until Pro or Scale unlocks, then link you to the dashboard, API docs, and pricing. No card data is stored on OGKit.',
  pathname: '/pricing/success',
})

/** Transactional return page — not indexable (thin, user-specific, no SEO value). */
export const metadata = {
  ...base,
  robots: { index: false, follow: true, googleBot: { index: false, follow: true } },
}

export default function PricingSuccessPage() {
  return (
    <div className="container max-w-lg space-y-4 py-16">
      <h1 className="text-3xl font-bold">Checkout status</h1>
      <Suspense fallback={null}>
        <PricingSuccessContent />
      </Suspense>
    </div>
  )
}
