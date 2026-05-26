import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { absoluteSiteUrl, withBasePath } from '@/config/paths'
import { siteConfig } from '@/config/site'
import { TEMPLATE_IDS, TEMPLATE_META } from '@/config/templates'
import { buildNextJsGenerateMetadataSnippet } from '@/lib/mcp/nextjs-snippet'
import { buildOgImageUrl, parseTemplateId } from '@/lib/mcp/og-url'
import { validatePageOpenGraph } from '@/lib/mcp/validate-page'

const MCP_INSTRUCTIONS = `OGKit hosted Open Graph image API (${siteConfig.url}).

Use these tools when the user needs og:image / twitter:image / social preview cards (1200×630 PNG).
Always build absolute HTTPS URLs on ${siteConfig.url} — never invent hosts or paths.

Free previews: pass demo mode (default) with demo=1 — watermarked, no API key.
Production: user signs in at ${absoluteSiteUrl('/login')} for an API key, or uses Gumroad/Cryptomus on ${absoluteSiteUrl('/pricing')}.

Prefer og_build_url + og_nextjs_snippet for Next.js App Router metadata.openGraph.images.
Human docs: ${absoluteSiteUrl('/docs')} · Machine index: ${absoluteSiteUrl('/llms.txt')}`

export function createOgkitMcpServer(): McpServer {
  const server = new McpServer(
    { name: 'ogkit', version: '1.0.0' },
    { instructions: MCP_INSTRUCTIONS },
  )

  server.registerTool(
    'og_list_templates',
    {
      title: 'List OGKit templates',
      description: 'List available OG image templates (article, product, minimal, etc.) with short descriptions.',
      inputSchema: z.object({}),
    },
    async () => ({
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            TEMPLATE_IDS.map((id) => ({
              id,
              description: TEMPLATE_META[id].description,
              examplePath: `/api/og/${id}`,
            })),
            null,
            2,
          ),
        },
      ],
    }),
  )

  server.registerTool(
    'og_build_url',
    {
      title: 'Build OGKit image URL',
      description:
        'Build a canonical OGKit HTTPS image URL for a template and fields. Defaults to demo=1 (watermarked, no key).',
      inputSchema: z.object({
        template: z.string().describe('Template id, e.g. article, minimal, product'),
        title: z.string().min(1).max(300),
        subtitle: z.string().max(500).optional(),
        author: z.string().max(100).optional(),
        image: z.string().url().optional(),
        logo: z.string().url().optional(),
        price: z.string().max(40).optional(),
        accent: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
        demo: z.boolean().optional().describe('Use demo=1 watermark preview (default true)'),
        apiKey: z.string().optional().describe('Production API key — omit for demo'),
      }),
    },
    async (args) => {
      const template = parseTemplateId(args.template)
      if (!template) {
        return {
          content: [{ type: 'text', text: `Unknown template "${args.template}". Call og_list_templates first.` }],
          isError: true,
        }
      }
      const url = buildOgImageUrl({
        template,
        title: args.title,
        subtitle: args.subtitle,
        author: args.author,
        image: args.image,
        logo: args.logo,
        price: args.price,
        accent: args.accent,
        demo: args.demo ?? !args.apiKey,
        apiKey: args.apiKey,
      })
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                url,
                template,
                dimensions: '1200x630',
                usage: 'Set metadata.openGraph.images and twitter.images to this URL (server-side).',
                playground: absoluteSiteUrl(withBasePath('/playground')),
              },
              null,
              2,
            ),
          },
        ],
      }
    },
  )

  server.registerTool(
    'og_preview',
    {
      title: 'Preview OGKit image URL',
      description: 'Return a demo OGKit image URL suitable for opening in a browser or embedding in chat.',
      inputSchema: z.object({
        template: z.string(),
        title: z.string().min(1).max(300),
        subtitle: z.string().max(500).optional(),
        author: z.string().max(100).optional(),
        accent: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
      }),
    },
    async (args) => {
      const template = parseTemplateId(args.template)
      if (!template) {
        return {
          content: [{ type: 'text', text: `Unknown template "${args.template}".` }],
          isError: true,
        }
      }
      const url = buildOgImageUrl({
        template,
        title: args.title,
        subtitle: args.subtitle,
        author: args.author,
        accent: args.accent,
        demo: true,
      })
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                previewUrl: url,
                note: 'Watermarked demo PNG. Open URL directly to verify layout before wiring metadata.',
              },
              null,
              2,
            ),
          },
        ],
      }
    },
  )

  server.registerTool(
    'og_nextjs_snippet',
    {
      title: 'Next.js generateMetadata snippet',
      description: 'Generate Next.js App Router generateMetadata() code wiring OGKit openGraph.images + twitter.images.',
      inputSchema: z.object({
        template: z.string(),
        title: z.string().min(1).max(300),
        subtitle: z.string().max(500).optional(),
        author: z.string().max(100).optional(),
        apiKeyEnv: z.string().optional().describe('Env var for API key, default OGKIT_API_KEY'),
        previewWithDemo: z.boolean().optional().describe('If true, snippet uses demo=1 only'),
      }),
    },
    async (args) => {
      const template = parseTemplateId(args.template)
      if (!template) {
        return {
          content: [{ type: 'text', text: `Unknown template "${args.template}".` }],
          isError: true,
        }
      }
      const code = buildNextJsGenerateMetadataSnippet({
        template,
        title: args.title,
        subtitle: args.subtitle,
        author: args.author,
        apiKeyEnv: args.apiKeyEnv,
        previewWithDemo: args.previewWithDemo ?? true,
      })
      return { content: [{ type: 'text', text: code }] }
    },
  )

  server.registerTool(
    'og_validate_page',
    {
      title: 'Validate page Open Graph metadata',
      description: 'Fetch a page HTML and report og:image, twitter:image, and common SEO/social preview issues.',
      inputSchema: z.object({
        pageUrl: z.string().url().describe('Public HTTPS URL of the page to inspect'),
      }),
    },
    async (args) => {
      const result = await validatePageOpenGraph(args.pageUrl)
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        isError: result.issues.some((i) => i.level === 'error'),
      }
    },
  )

  server.registerTool(
    'ogkit_get_started',
    {
      title: 'OGKit onboarding links',
      description: 'Return canonical links for docs, pricing, playground, signup, and llms.txt.',
      inputSchema: z.object({}),
    },
    async () => ({
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              site: siteConfig.url,
              docs: absoluteSiteUrl('/docs'),
              playground: absoluteSiteUrl('/playground'),
              pricing: absoluteSiteUrl('/pricing'),
              login: absoluteSiteUrl('/login'),
              llmsTxt: absoluteSiteUrl('/llms.txt'),
              seoGuide: absoluteSiteUrl('/blog/open-graph-images-seo-guide'),
              mcpEndpoint: absoluteSiteUrl('/api/mcp'),
              cursorPlugin: 'https://github.com/marfa77/webmorph/tree/main/ogkit/cursor-plugin',
            },
            null,
            2,
          ),
        },
      ],
    }),
  )

  return server
}
