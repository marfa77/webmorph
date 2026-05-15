import { z } from 'zod'
import { GUMROAD_OGKIT_PRODUCT_ID } from '@/config/gumroad'

const gumroadVerifyJsonSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  purchase: z
    .object({
      email: z.string().nullable().optional(),
      sale_id: z.string().nullable().optional(),
      test: z.boolean().optional(),
      /** Present on some Gumroad payloads; v1 maps all successful verifies to Pro monthly regardless. */
      price: z.union([z.number(), z.string()]).optional(),
    })
    .optional(),
})

export type GumroadVerifyResult =
  | { ok: true; email: string | null; saleId: string | null; test: boolean }
  | { ok: false; message: string }

/** Same rule as UAEProperty: use env only when it looks like a Gumroad API product id (`…==`). */
function resolveGumroadProductId(): string {
  const env = process.env.GUMROAD_PRODUCT_ID?.trim()
  if (env && env.endsWith('==')) return env
  return GUMROAD_OGKIT_PRODUCT_ID
}

/**
 * Server-only Gumroad license verify. POST https://api.gumroad.com/v2/licenses/verify
 * Uses API `product_id` (often ends with `==`), not the human checkout slug.
 */
export async function verifyGumroadLicense(licenseKey: string): Promise<GumroadVerifyResult> {
  const trimmed = licenseKey.trim()
  if (!trimmed || trimmed.length > 200) {
    return { ok: false, message: 'Enter the license key from your Gumroad receipt email.' }
  }

  const productId = resolveGumroadProductId()

  const body = new URLSearchParams({
    product_id: productId,
    license_key: trimmed,
    increment_uses_count: 'false',
  })

  try {
    const res = await fetch('https://api.gumroad.com/v2/licenses/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      cache: 'no-store',
    })

    const raw: unknown = await res.json().catch(() => ({}))
    const parsed = gumroadVerifyJsonSchema.safeParse(raw)
    if (!parsed.success) {
      return { ok: false, message: 'Unexpected response from Gumroad. Try again later.' }
    }

    const data = parsed.data
    if (!data.success) {
      return {
        ok: false,
        message: data.message || 'Invalid or expired license key. Check the key in your Gumroad email.',
      }
    }

    const purchase = data.purchase
    return {
      ok: true,
      email: purchase?.email != null ? String(purchase.email) : null,
      saleId: purchase?.sale_id != null ? String(purchase.sale_id) : null,
      test: Boolean(purchase?.test),
    }
  } catch (err) {
    console.error('[gumroad] verify request failed:', err instanceof Error ? err.message : 'unknown')
    return { ok: false, message: 'Could not reach Gumroad. Try again in a minute.' }
  }
}
