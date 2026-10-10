import { absoluteSiteUrl } from '@/config/paths'
import type { MetadataRoute } from 'next'

/** PixID Layer A AI allowlist — Allow: / for each bot. */
const AI_BOTS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-Web',
  'PerplexityBot',
  'Amazonbot',
  'YouBot',
  'Applebot-Extended',
  'cohere-ai',
  'Meta-ExternalAgent',
  'Google-Extended',
  'anthropic-ai',
  'CCBot',
] as const

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/' },
      ...AI_BOTS.map((userAgent) => ({ userAgent, allow: '/' })),
    ],
    sitemap: [absoluteSiteUrl('/sitemap.xml'), 'https://www.webmorp.art/sitemap.xml'],
  }
}
