import { NextResponse } from 'next/server'
import { fetchAdoptionReportData, formatAdoptionTelegramReport } from '@/lib/analytics/adoption-report'
import { authorizeCron } from '@/lib/gsc/auth-cron'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Manual-only: adoption funnel digest preview (daily Telegram cron disabled). */
export async function GET(request: Request) {
  const denied = authorizeCron(request)
  if (denied) return denied

  try {
    const data = await fetchAdoptionReportData()
    const text = formatAdoptionTelegramReport(data)

    return NextResponse.json({
      ok: true,
      telegram: 'disabled',
      preview: text,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown'
    console.error('[cron/daily-summary]', message)
    return NextResponse.json({ error: 'daily_summary_failed', message }, { status: 502 })
  }
}
