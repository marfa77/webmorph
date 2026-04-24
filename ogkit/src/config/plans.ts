export type Plan = 'free' | 'pro' | 'scale'

export const PLANS = {
  free: {
    id: 'free' as const,
    name: 'Free',
    priceMonthly: 0,
    lemonVariantId: null,
    monthlyCap: 100,
    dailyCap: 10,
    watermark: true,
    features: ['100 images / month', 'Watermark on free tier', '10 templates', 'Community support'],
  },
  pro: {
    id: 'pro' as const,
    name: 'Pro',
    priceMonthly: 19,
    lemonVariantId: process.env.LEMON_VARIANT_PRO_MONTHLY ?? '',
    monthlyCap: 50_000,
    dailyCap: null,
    watermark: false,
    features: [
      '50,000 images / month',
      'No watermark',
      'All templates',
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
      'Priority support',
    ],
  },
} as const

export function isPaidPlan(p: string): p is 'pro' | 'scale' {
  return p === 'pro' || p === 'scale'
}
