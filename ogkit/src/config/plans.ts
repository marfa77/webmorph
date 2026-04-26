export type Plan = 'free' | 'pro' | 'scale'

export const PLANS = {
  free: {
    id: 'free' as const,
    name: 'Free',
    priceMonthly: 0,
    lemonVariantId: null,
    monthlyCap: 1_000,
    dailyCap: null,
    watermark: true,
    features: ['1,000 images / month', 'Watermark on free tier', '10 templates', 'No-login demo previews', 'Community support'],
  },
  pro: {
    id: 'pro' as const,
    name: 'Pro',
    priceMonthly: 19,
    lemonVariantId: process.env.LEMON_VARIANT_PRO_MONTHLY ?? '',
    monthlyCap: 100_000,
    dailyCap: null,
    watermark: false,
    features: [
      '100,000 images / month',
      'No watermark',
      'All templates',
      'Signed URLs and domain allowlists',
      'Email support',
      'Custom fonts (Google Fonts)',
    ],
  },
  scale: {
    id: 'scale' as const,
    name: 'Scale',
    priceMonthly: 99,
    lemonVariantId: process.env.LEMON_VARIANT_SCALE_MONTHLY ?? '',
    monthlyCap: 1_000_000,
    dailyCap: null,
    watermark: false,
    features: [
      '1,000,000 images / month',
      'No watermark',
      'Priority CDN',
      'All templates',
      'Signed URLs and domain allowlists',
      'Priority support',
    ],
  },
} as const

export function isPaidPlan(p: string): p is 'pro' | 'scale' {
  return p === 'pro' || p === 'scale'
}
