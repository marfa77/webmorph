import { lemonSqueezySetup } from '@lemonsqueezy/lemonsqueezy.js'

export function configureLemon() {
  lemonSqueezySetup({
    apiKey: process.env.LEMON_API_KEY ?? '',
    onError: (err) => console.error('[lemonsqueezy]', err),
  })
}
