/**
 * GET /api/gsc/analytics?days=28 — Search Console performance summary.
 * Auth: Authorization: Bearer CRON_SECRET
 */
import { NextResponse } from 'next/server'
import { authorizeCron } from '@/lib/gsc/auth-cron'
import { fetchGscAnalyticsSummary, isGscConfigured, listGscSites } from '@/lib/gsc/client'
import { gscNotConfiguredBody, getGscSiteUrl } from '@/lib/gsc/config'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const denied = authorizeCron(request)
  if (denied) return denied

  if (!isGscConfigured()) {
    return NextResponse.json(gscNotConfiguredBody(), { status: 503 })
  }

  const daysParam = new URL(request.url).searchParams.get('days')
  const days = daysParam ? Math.min(90, Math.max(7, Number.parseInt(daysParam, 10) || 28)) : 28
  const listSites = new URL(request.url).searchParams.get('listSites') === '1'

  try {
    if (listSites) {
      const sites = await listGscSites()
      return NextResponse.json({ ok: true, configuredSiteUrl: getGscSiteUrl(), sites })
    }

    const summary = await fetchGscAnalyticsSummary(days)
    return NextResponse.json({ ok: true, summary })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown'
    console.error('[gsc/analytics]', message)
    return NextResponse.json({ error: 'gsc_analytics_failed', message }, { status: 502 })
  }
}
