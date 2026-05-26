import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import { createOgkitMcpServer } from '@/lib/mcp/create-ogkit-mcp-server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

async function handleMcp(request: Request): Promise<Response> {
  const meta = {
    userAgent: request.headers.get('user-agent') ?? undefined,
  }
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  })
  const server = createOgkitMcpServer(meta)

  try {
    await server.connect(transport)
    return await transport.handleRequest(request)
  } finally {
    await transport.close()
    await server.close()
  }
}

export async function GET(request: Request) {
  return handleMcp(request)
}

export async function POST(request: Request) {
  return handleMcp(request)
}

export async function DELETE(request: Request) {
  return handleMcp(request)
}
