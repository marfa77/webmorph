/**
 * POST /api/billing/gumroad/redeem — authenticated Gumroad Pro license redemption.
 * v1: single product (`GUMROAD_PRODUCT_ID`); successful verify → Pro + 30d stacked on `crypto_paid_until`
 * (same semantics as Cryptomus monthly grant; see `completeCryptoOrderFromWebhook`).
 */
import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { gumroadRedeemNotConfiguredBody } from '@/config/billing'
import { isGumroadRedeemConfigured } from '@/config/gumroad'
import { db } from '@/lib/db'
import { gumroadRedemptions, users } from '@/lib/db/schema'
import { hashGumroadLicenseKey } from '@/lib/gumroad/hash-license-key'
import { gumroadRedeemRateLimitOk } from '@/lib/gumroad/redeem-rate-limit'
import { verifyGumroadLicense } from '@/lib/gumroad/verify-license'
import type { PlanTier } from '@/lib/db/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MS_PER_DAY = 86_400_000
/** Matches `CRYPTO_BILLING_PERIOD_DAYS` — Gumroad SKU is treated as Pro monthly ($19 in PLANS). */
const GUMROAD_PRO_GRANT_DAYS = 30

const bodySchema = z.object({
  licenseKey: z
    .string()
    .max(220)
    .transform((s) => s.trim())
    .refine((s) => s.length > 0, { message: 'License key is required.' }),
})

function isDuplicateKeyError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false
  const code = (err as { code?: string | number }).code
  return code === 'ER_DUP_ENTRY' || code === 1062
}

export async function POST(req: Request) {
  if (!isGumroadRedeemConfigured()) {
    return NextResponse.json(gumroadRedeemNotConfiguredBody(), { status: 503 })
  }

  const session = await auth()
  const userId = session?.user?.id
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!gumroadRedeemRateLimitOk(userId)) {
    return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 })
  }

  let licenseKey: string
  try {
    const json: unknown = await req.json().catch(() => ({}))
    licenseKey = bodySchema.parse(json).licenseKey
  } catch (e) {
    if (e instanceof z.ZodError) {
      const msg = e.errors[0]?.message ?? 'Invalid request body.'
      return NextResponse.json({ error: msg }, { status: 400 })
    }
    return NextResponse.json({ error: 'License key is required.' }, { status: 400 })
  }

  const verified = await verifyGumroadLicense(licenseKey)
  if (!verified.ok) {
    return NextResponse.json({ error: verified.message }, { status: 400 })
  }

  const licenseHash = hashGumroadLicenseKey(licenseKey)

  const [existing] = await db
    .select()
    .from(gumroadRedemptions)
    .where(eq(gumroadRedemptions.licenseKeyHash, licenseHash))
    .limit(1)

  if (existing && existing.userId !== userId) {
    return NextResponse.json(
      { error: 'This license is already linked to another account.' },
      { status: 409 },
    )
  }

  if (existing && existing.userId === userId) {
    const [u] = await db.select({ cryptoPaidUntil: users.cryptoPaidUntil, plan: users.plan }).from(users).where(eq(users.id, userId)).limit(1)
    return NextResponse.json({
      ok: true,
      alreadyRedeemed: true,
      plan: u?.plan ?? 'pro',
      cryptoPaidUntil: u?.cryptoPaidUntil?.toISOString() ?? null,
      test: verified.test,
    })
  }

  try {
    const result = await db.transaction(async (tx) => {
      const [userRow] = await tx.select().from(users).where(eq(users.id, userId)).limit(1)
      if (!userRow) {
        return { error: 'user_not_found' as const }
      }

      const now = Date.now()
      const currentEnd = userRow.cryptoPaidUntil ? userRow.cryptoPaidUntil.getTime() : 0
      const base = (currentEnd > now ? currentEnd : now) + GUMROAD_PRO_GRANT_DAYS * MS_PER_DAY
      const cryptoPaidUntil = new Date(base)
      const newPlan: PlanTier = userRow.plan === 'scale' ? 'scale' : 'pro'

      await tx.insert(gumroadRedemptions).values({
        licenseKeyHash: licenseHash,
        userId,
        gumroadSaleId: verified.saleId,
      })

      await tx
        .update(users)
        .set({
          plan: newPlan,
          cryptoPaidUntil,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId))

      return { ok: true as const, plan: newPlan, cryptoPaidUntil }
    })

    if ('error' in result && result.error === 'user_not_found') {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 })
    }
    if ('ok' in result && result.ok) {
      return NextResponse.json({
        ok: true,
        alreadyRedeemed: false,
        plan: result.plan,
        cryptoPaidUntil: result.cryptoPaidUntil.toISOString(),
        test: verified.test,
      })
    }
  } catch (err) {
    if (isDuplicateKeyError(err)) {
      const [row] = await db
        .select()
        .from(gumroadRedemptions)
        .where(eq(gumroadRedemptions.licenseKeyHash, licenseHash))
        .limit(1)
      if (row?.userId === userId) {
        const [u] = await db.select({ cryptoPaidUntil: users.cryptoPaidUntil, plan: users.plan }).from(users).where(eq(users.id, userId)).limit(1)
        return NextResponse.json({
          ok: true,
          alreadyRedeemed: true,
          plan: u?.plan ?? 'pro',
          cryptoPaidUntil: u?.cryptoPaidUntil?.toISOString() ?? null,
          test: verified.test,
        })
      }
      return NextResponse.json({ error: 'This license was just redeemed elsewhere.' }, { status: 409 })
    }
    console.error('[gumroad/redeem] transaction failed:', err instanceof Error ? err.message : 'unknown')
    return NextResponse.json({ error: 'Redemption failed. Try again.' }, { status: 500 })
  }

  return NextResponse.json({ error: 'Redemption failed.' }, { status: 500 })
}
