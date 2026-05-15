/**
 * Gumroad checkout + API product id for OGKit Pro (UAEProperty-style: defaults in code, env optional).
 * License verify uses `GUMROAD_OGKIT_PRODUCT_ID` unless `GUMROAD_PRODUCT_ID` is set and ends with `==`.
 */

/** Gumroad API `product_id` for `/v2/licenses/verify` (not the human `/l/...` checkout slug). */
export const GUMROAD_OGKIT_PRODUCT_ID = 'EBdtcFmV2YE1nv2qcZO2Ew=='

/** Card checkout URL for OGKit Pro on Gumroad. */
export const GUMROAD_CHECKOUT_URL = 'https://pixidstudio.gumroad.com/l/quspd'

export function getGumroadCheckoutUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_GUMROAD_CHECKOUT_URL?.trim()
  if (fromEnv) return fromEnv
  return GUMROAD_CHECKOUT_URL
}
