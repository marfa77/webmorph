import type { GscAnalyticsSummary } from '@/lib/gsc/client'

function pct(n: number): string {
  return `${(n * 100).toFixed(1)}%`
}

function num(n: number): string {
  return n.toLocaleString('en-US')
}

/** Compact Telegram-friendly GSC digest. */
export function formatGscTelegramSummary(summary: GscAnalyticsSummary): string {
  const lines = [
    `GSC ${summary.startDate} → ${summary.endDate}`,
    `${summary.siteUrl}`,
    `Clicks ${num(summary.totals.clicks)} · Impr ${num(summary.totals.impressions)} · CTR ${pct(summary.totals.ctr)} · Pos ${summary.totals.position.toFixed(1)}`,
  ]

  if (summary.topQueries.length > 0) {
    lines.push('', 'Top queries:')
    for (const row of summary.topQueries.slice(0, 5)) {
      lines.push(`• ${row.keys[0] ?? '?'} — ${num(row.clicks)} clk / ${num(row.impressions)} impr`)
    }
  }

  if (summary.topPages.length > 0) {
    lines.push('', 'Top pages:')
    for (const row of summary.topPages.slice(0, 3)) {
      const path = row.keys[0]?.replace(/^https?:\/\/[^/]+/, '') || row.keys[0] || '?'
      lines.push(`• ${path} — ${num(row.clicks)} clk`)
    }
  }

  return lines.join('\n')
}
