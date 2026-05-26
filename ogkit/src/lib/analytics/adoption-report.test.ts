import { describe, expect, it } from 'vitest'
import { formatAdoptionTelegramReport, type AdoptionReportData } from '@/lib/analytics/adoption-report'

describe('formatAdoptionTelegramReport', () => {
  it('includes conclusions when MCP hits goal', () => {
    const data: AdoptionReportData = {
      todayUtc: '2026-05-26',
      yesterdayUtc: '2026-05-25',
      rows: [
        { d: '2026-05-25', event_name: 'mcp_tool_called', c: 12 },
        { d: '2026-05-26', event_name: 'mcp_tool_called', c: 3 },
      ],
      mcpTools: [{ tool: 'og_build_url', c: 8 }],
    }
    const text = formatAdoptionTelegramReport(data)
    expect(text).toContain('mcp_tool_called')
    expect(text).toContain('Выводы')
    expect(text).toContain('Top MCP tools')
  })

  it('handles empty data', () => {
    const text = formatAdoptionTelegramReport({
      todayUtc: '2026-05-26',
      yesterdayUtc: '2026-05-25',
      rows: [],
      mcpTools: [],
    })
    expect(text).toContain('Событий нет')
  })
})
