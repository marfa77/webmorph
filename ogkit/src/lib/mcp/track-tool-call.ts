import { trackFunnelEventSoon } from '@/lib/analytics/funnel'

export type McpRequestMeta = {
  userAgent?: string
}

export function trackMcpToolCall(toolName: string, meta: McpRequestMeta & { isError?: boolean } = {}) {
  trackFunnelEventSoon({
    eventName: 'mcp_tool_called',
    source: 'mcp',
    properties: {
      tool: toolName,
      isError: meta.isError ?? false,
      ...(meta.userAgent ? { userAgent: meta.userAgent.slice(0, 200) } : {}),
    },
  })
}
