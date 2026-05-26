/**
 * POST /api/gsc/sitemap — submit sitemap to Google Search Console.
 * Auth: Authorization: Bearer CRON_SECRET
 */
import { NextResponse } from 'next/server'
import { authorizeCron } from '@/lib/gsc/auth-cron'
import { submitGscSitemap, isGscConfigured } from '@/lib/gsc/client'
import { gscNotConfiguredBody } from '@/lib/gsc/config'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const denied = authorizeCron(request)
  if (denied) return denied

  if (!isGscConfigured()) {
    return NextResponse.json(gscNotConfiguredBody(), { status: 503 })
  }

  try {
    const result = await submitGscSitemap()
    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown'
    console.error('[gsc/sitemap]', message)
    return NextResponse.json({ error: 'gsc_submit_failed', message }, { status: 502 })
  }
}
