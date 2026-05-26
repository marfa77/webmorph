import { NextResponse } from 'next/server'
import { fetchAdoptionReportData, formatAdoptionTelegramReport } from '@/lib/analytics/adoption-report'
import { authorizeCron } from '@/lib/gsc/auth-cron'
import { sendTelegramMessage } from '@/lib/notifications/telegram'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Daily 07:00 UTC — adoption funnel digest + conclusions to Telegram. */
export async function GET(request: Request) {
  const denied = authorizeCron(request)
  if (denied) return denied

  try {
    const data = await fetchAdoptionReportData()
    const text = formatAdoptionTelegramReport(data)
    const telegram = await sendTelegramMessage({ text })

    return NextResponse.json({
      ok: true,
      telegram: telegram.ok ? 'sent' : telegram.skipped ? 'skipped' : 'failed',
      preview: text,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown'
    console.error('[cron/daily-summary]', message)
    return NextResponse.json({ error: 'daily_summary_failed', message }, { status: 502 })
  }
}
