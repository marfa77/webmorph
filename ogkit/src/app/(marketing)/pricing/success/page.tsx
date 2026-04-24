import { Suspense } from 'react'
import { siteConfig } from '@/config/site'
import { PricingSuccessContent } from './success-content'

export const metadata = { title: `Thanks — ${siteConfig.name}` }

export default function PricingSuccessPage() {
  return (
    <Suspense fallback={null}>
      <PricingSuccessContent />
    </Suspense>
  )
}
