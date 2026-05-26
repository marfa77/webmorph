import { describe, expect, it } from 'vitest'
import { ADOPTION_EVENTS, formatFunnelTelegramAlert } from '@/lib/analytics/funnel'

describe('formatFunnelTelegramAlert', () => {
  it('formats MCP tool calls compactly', () => {
    const text = formatFunnelTelegramAlert({
      eventName: 'mcp_tool_called',
      source: 'mcp',
      properties: { tool: 'og_list_templates' },
    })
    expect(text).toBe('🔌 mcp_tool_called · og_list_templates · mcp')
  })

  it('formats demo previews with template', () => {
    const text = formatFunnelTelegramAlert({
      eventName: 'demo_preview_generated',
      source: 'demo',
      properties: { template: 'minimal' },
    })
    expect(text).toBe('🖼 demo_preview_generated · minimal · demo')
  })
})

describe('ADOPTION_EVENTS', () => {
  it('includes MCP and demo events for instant notify', () => {
    expect(ADOPTION_EVENTS).toContain('mcp_tool_called')
    expect(ADOPTION_EVENTS).toContain('demo_preview_generated')
  })
})
