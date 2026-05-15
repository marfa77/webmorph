/**
 * OGKit is crypto-native: Cryptomus handles paid checkout with no card processor.
 * Lemon support remains in code for compatibility, but marketing should lead with crypto.
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
  return { error: 'billing_disabled' as const, message: 'Card checkout is not used for OGKit. Use crypto checkout on the pricing page.' }
}

export function cryptoBillingNotConfiguredBody() {
  return { error: 'crypto_billing_disabled' as const, message: 'Crypto checkout is not configured.' }
}

export function gumroadRedeemNotConfiguredBody() {
  return {
    error: 'gumroad_disabled' as const,
    message: 'Gumroad license redemption is not configured (missing GUMROAD_PRODUCT_ID).',
  }
}
