/**
 * GET /api/cron/gsc — weekly: submit sitemap + pull GSC analytics + optional Telegram digest.
 * Vercel Cron: Authorization: Bearer CRON_SECRET
 */
import { NextResponse } from 'next/server'
import { authorizeCron } from '@/lib/gsc/auth-cron'
import { fetchGscAnalyticsSummary, isGscConfigured, submitGscSitemap } from '@/lib/gsc/client'
import { gscNotConfiguredBody } from '@/lib/gsc/config'
import { formatGscTelegramSummary } from '@/lib/gsc/format-summary'
import { sendTelegramMessage } from '@/lib/notifications/telegram'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const denied = authorizeCron(request)
  if (denied) return denied

  if (!isGscConfigured()) {
    return NextResponse.json({ ...gscNotConfiguredBody(), skipped: true })
  }

  try {
    const sitemap = await submitGscSitemap()
    const summary = await fetchGscAnalyticsSummary(28)
    const telegram = formatGscTelegramSummary(summary)
    const notify = await sendTelegramMessage({ text: telegram })

    return NextResponse.json({
      ok: true,
      sitemap,
      summary,
      telegram: notify.ok ? 'sent' : notify.skipped ? 'skipped' : 'failed',
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown'
    console.error('[cron/gsc]', message)
    return NextResponse.json({ error: 'gsc_cron_failed', message }, { status: 502 })
  }
}
