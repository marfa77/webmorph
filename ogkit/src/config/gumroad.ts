/**
 * Gumroad checkout for OGKit Pro (card / Gumroad wallet). Public URL only.
 * Override via env if the product moves.
 */
export function getGumroadCheckoutUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_GUMROAD_CHECKOUT_URL?.trim()
  if (fromEnv) return fromEnv
  return 'https://pixidstudio.gumroad.com/l/quspd'
}

export function isGumroadRedeemConfigured(): boolean {
  return Boolean(process.env.GUMROAD_PRODUCT_ID?.trim())
}
