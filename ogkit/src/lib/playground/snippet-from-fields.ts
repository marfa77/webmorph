import type { TemplateId } from '@/config/templates'
import { buildNextJsGenerateMetadataSnippet } from '@/lib/mcp/nextjs-snippet'
import type { OgUrlOptions } from '@/lib/mcp/og-url'

const DIRECT_FIELDS = ['subtitle', 'author', 'image', 'logo', 'price'] as const
const EXTRA_PARAM_FIELDS = [
  'date',
  'location',
  'company',
  'episode',
  'show',
  'tagline',
  'code',
  'language',
  'avatar',
  'theme',
  'bg',
  'font',
  'pattern',
] as const

function validAccent(value: string | undefined): string | undefined {
  const accent = value?.trim()
  return accent && /^#[0-9a-fA-F]{6}$/.test(accent) ? accent : undefined
}

export function playgroundFieldsToOgOptions(
  template: TemplateId,
  fields: Record<string, string>,
  apiKey: string,
): OgUrlOptions {
  const title = (fields.title ?? '').trim()
  const trimmedKey = apiKey.trim()
  const options: OgUrlOptions = {
    template,
    title,
    accent: validAccent(fields.accent),
    apiKey: trimmedKey || undefined,
    demo: !trimmedKey,
  }

  for (const key of DIRECT_FIELDS) {
    const value = fields[key]?.trim()
    if (value) options[key] = value
  }

  const extraParams: Record<string, string> = {}
  for (const key of EXTRA_PARAM_FIELDS) {
    const value = fields[key]?.trim()
    if (value) extraParams[key] = value
  }
  if (Object.keys(extraParams).length > 0) {
    options.extraParams = extraParams
  }

  return options
}

export function buildPlaygroundNextJsSnippet(
  template: TemplateId,
  fields: Record<string, string>,
  apiKey: string,
): string | null {
  const title = (fields.title ?? '').trim()
  if (!title) return null

  const trimmedKey = apiKey.trim()
  return buildNextJsGenerateMetadataSnippet({
    ...playgroundFieldsToOgOptions(template, fields, apiKey),
    previewWithDemo: !trimmedKey,
    apiKey: trimmedKey || undefined,
    apiKeyEnv: 'OGKIT_API_KEY',
  })
}
