/**
 * When all Lemon env vars are set, marketing can link to real card checkout.
 * Cryptomus (crypto) is a separate path: invoice + webhook, no card processor.
 * The app is feature-complete without either: auth, API keys, OG API, Playground, waitlist.
 */
const LEMON_CHECKOUT_VARS = [
  'LEMON_API_KEY',
  'LEMON_STORE_ID',
  'LEMON_VARIANT_PRO_MONTHLY',
  'LEMON_VARIANT_SCALE_MONTHLY',
] as const

const CRYPTOMUS_VARS = ['CRYPTOMUS_MERCHANT_ID', 'CRYPTOMUS_API_KEY'] as const

export function isBillingLive(): boolean {
  return LEMON_CHECKOUT_VARS.every((k) => Boolean(process.env[k]))
}

export function isCryptoBillingLive(): boolean {
  return CRYPTOMUS_VARS.every((k) => Boolean(process.env[k]))
}

export function billingNotConfiguredBody() {
  return { error: 'billing_disabled' as const, message: 'Paid checkout is not configured. Use the waitlist on the pricing page.' }
}

export function cryptoBillingNotConfiguredBody() {
  return { error: 'crypto_billing_disabled' as const, message: 'Crypto checkout is not configured.' }
}
