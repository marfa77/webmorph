'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { getApiUrl, withBasePath } from '@/config/paths'
import { TEMPLATE_IDS, TEMPLATE_META, type TemplateId } from '@/config/templates'
import { siteConfig } from '@/config/site'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Copy, RefreshCw } from 'lucide-react'

const STORAGE_KEY = 'ogkit_playground_api_key'

type FieldKey =
  | 'title'
  | 'subtitle'
  | 'author'
  | 'image'
  | 'logo'
  | 'price'
  | 'date'
  | 'location'
  | 'company'
  | 'episode'
  | 'show'
  | 'tagline'
  | 'code'
  | 'language'
  | 'avatar'
  | 'theme'
  | 'accent'
  | 'bg'
  | 'font'
  | 'pattern'

const TEMPLATE_FIELDS: Record<TemplateId, FieldKey[]> = {
  article: ['title', 'subtitle', 'author', 'image'],
  product: ['title', 'price', 'image', 'logo'],
  quote: ['title', 'author', 'avatar'],
  podcast: ['title', 'episode', 'show', 'image'],
  event: ['title', 'date', 'location', 'image'],
  job: ['title', 'company', 'location', 'logo'],
  minimal: ['title', 'subtitle'],
  brand: ['title', 'tagline', 'logo'],
  gradient: ['title', 'subtitle'],
  'dark-code': ['title', 'code', 'language'],
}

const FIELD_LABEL: Record<FieldKey, string> = {
  title: 'Title',
  subtitle: 'Subtitle',
  author: 'Author',
  image: 'Image URL',
  logo: 'Logo URL',
  price: 'Price',
  date: 'Date',
  location: 'Location',
  company: 'Company',
  episode: 'Episode',
  show: 'Show / podcast name',
  tagline: 'Tagline',
  code: 'Code',
  language: 'Language',
  avatar: 'Avatar URL',
  theme: 'Theme',
  accent: 'Accent color',
  bg: 'Background color',
  font: 'Font family',
  pattern: 'Pattern',
}

const DEFAULT_VALUES: Record<string, string> = {
  title: 'Hello from OGKit',
  subtitle: 'Build OG images in one URL',
  author: 'You',
  price: '€19',
  date: '12 Apr 2026, 19:00',
  location: 'Lisbon',
  company: 'ACME',
  episode: 'EP 42',
  show: 'Dev Weekly',
  tagline: 'Ship faster',
  code: "console.log('OG')",
  language: 'ts',
  image: 'https://placehold.co/200x200/png',
  logo: 'https://placehold.co/120x40/png',
  avatar: 'https://placehold.co/200x200/png',
  theme: 'light',
  accent: '#2563eb',
  bg: '#ffffff',
  font: 'Inter',
  pattern: 'none',
}

function buildImageUrl(
  baseOrigin: string,
  template: TemplateId,
  apiKey: string,
  fields: Record<string, string>,
  bust: number,
): string | null {
  const t = (fields.title ?? '').trim()
  if (!t) return null
  const params = new URLSearchParams()
  if (apiKey.trim()) params.set('key', apiKey.trim())
  else params.set('demo', '1')
  for (const [k, v] of Object.entries(fields)) {
    const s = (v ?? '').trim()
    if (s) params.set(k, s)
  }
  if (bust) params.set('_t', String(bust))
  return `${baseOrigin}${getApiUrl(`/api/og/${template}`)}?${params.toString()}`
}

export function PlaygroundClient() {
  const [template, setTemplate] = useState<TemplateId>('minimal')
  const [apiKey, setApiKey] = useState('')
  const [fields, setFields] = useState<Record<string, string>>({ title: DEFAULT_VALUES.title! })
  const [copyDone, setCopyDone] = useState(false)
  const [requestedImageUrl, setRequestedImageUrl] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewStatus, setPreviewStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [previewError, setPreviewError] = useState<string | null>(null)

  useEffect(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY)
      if (s) setApiKey(s)
    } catch {
      /* no localStorage */
    }
  }, [])

  useEffect(() => {
    const id = setTimeout(() => {
      try {
        if (apiKey.trim()) localStorage.setItem(STORAGE_KEY, apiKey.trim())
        else localStorage.removeItem(STORAGE_KEY)
      } catch {
        /* ignore */
      }
    }, 300)
    return () => clearTimeout(id)
  }, [apiKey])

  const imageUrl = useMemo(() => {
    if (typeof window === 'undefined') return null
    return buildImageUrl(window.location.origin, template, apiKey, fields, 0)
  }, [template, apiKey, fields])

  const cleanImageUrl = useMemo(() => {
    if (!imageUrl) return ''
    const u = new URL(imageUrl)
    u.searchParams.delete('_t')
    return u.toString()
  }, [imageUrl])

  useEffect(() => {
    if (!requestedImageUrl) {
      setPreviewUrl(null)
      setPreviewStatus('idle')
      setPreviewError(null)
      return
    }

    const controller = new AbortController()
    let objectUrl: string | null = null
    setPreviewStatus('loading')
    setPreviewError(null)

    const timeout = setTimeout(async () => {
      try {
        const response = await fetch(requestedImageUrl, { signal: controller.signal })
        if (!response.ok) {
          let error = `Preview failed with ${response.status}.`
          const contentType = response.headers.get('content-type') ?? ''
          if (contentType.includes('application/json')) {
            const data = (await response.json()) as { error?: string; cap?: number; period?: string }
            if (data.error === 'quota_exceeded') {
              error = `Quota exceeded${data.cap ? ` (${data.cap}/${data.period ?? 'period'})` : ''}. Create a new key or upgrade the plan.`
            } else if (data.error) {
              error = `Preview failed: ${data.error}.`
            }
          }
          setPreviewUrl(null)
          setPreviewStatus('error')
          setPreviewError(error)
          return
        }

        const blob = await response.blob()
        objectUrl = URL.createObjectURL(blob)
        setPreviewUrl(objectUrl)
        setPreviewStatus('ready')
      } catch (error) {
        if ((error as Error).name === 'AbortError') return
        setPreviewUrl(null)
        setPreviewStatus('error')
        setPreviewError('Could not load the image. Check the key, quota, and that URLs in fields are valid (http(s)).')
      }
    }, 600)

    return () => {
      clearTimeout(timeout)
      controller.abort()
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [requestedImageUrl])

  const onField = useCallback((key: string, value: string) => {
    setFields((f) => ({ ...f, [key]: value }))
  }, [])

  const onTemplate = useCallback((t: string) => {
    setTemplate(t as TemplateId)
  }, [])

  const fieldKeys = TEMPLATE_FIELDS[template]
  const appearanceFields: FieldKey[] = template === 'minimal' || template === 'gradient' ? ['theme', 'accent', 'bg', 'font', 'pattern'] : []
  const meta = TEMPLATE_META[template]

  async function copyUrl() {
    if (!cleanImageUrl) return
    await navigator.clipboard.writeText(cleanImageUrl)
    setCopyDone(true)
    setTimeout(() => setCopyDone(false), 2000)
  }

  function generatePreview() {
    if (!imageUrl) return
    const url = new URL(imageUrl)
    url.searchParams.set('source', 'playground')
    url.searchParams.set('_t', String(Date.now()))
    setRequestedImageUrl(url.toString())
  }

  return (
    <div className="container max-w-6xl space-y-6 py-8">
      <div>
        <h1 className="text-2xl font-bold">Playground</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Live preview and URL builder. The API key is kept in this browser only.
        </p>
      </div>
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Request</CardTitle>
              <CardDescription>
                {meta.title} — {meta.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="og-template">Template</Label>
                <select
                  id="og-template"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={template}
                  onChange={(e) => onTemplate(e.target.value)}
                >
                  {TEMPLATE_IDS.map((id) => (
                    <option key={id} value={id}>
                      {`${TEMPLATE_META[id].title} (${id})`}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <div className="flex items-baseline justify-between gap-2">
                  <Label htmlFor="og-key">API key</Label>
                  <Link
                    href={withBasePath('/dashboard/keys')}
                    className="text-xs text-muted-foreground underline hover:text-foreground"
                  >
                    Get a key
                  </Link>
                </div>
                <Input
                  id="og-key"
                  type="password"
                  autoComplete="off"
                  placeholder="Optional for demo previews"
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value)
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Leave blank to generate a watermarked demo URL. Add a key when you want quota tracking and production use.
                </p>
              </div>
              {fieldKeys.map((key) => {
                const multiline = key === 'code'
                return (
                  <div key={key} className="space-y-2">
                    <Label htmlFor={`og-f-${key}`}>
                      {FIELD_LABEL[key]}
                      {key === 'title' && <span className="text-destructive"> *</span>}
                    </Label>
                    {multiline ? (
                      <Textarea
                        id={`og-f-${key}`}
                        className="min-h-[100px] font-mono text-sm"
                        value={fields[key] ?? ''}
                        placeholder={DEFAULT_VALUES[key]}
                        onChange={(e) => onField(key, e.target.value)}
                      />
                    ) : (
                      <Input
                        id={`og-f-${key}`}
                        value={fields[key] ?? ''}
                        placeholder={DEFAULT_VALUES[key] ?? (key === 'title' ? 'Title' : '')}
                        onChange={(e) => onField(key, e.target.value)}
                      />
                    )}
                  </div>
                )
              })}
              {appearanceFields.length > 0 && (
                <div className="rounded-md border bg-muted/20 p-3">
                  <div className="text-sm font-medium">Appearance</div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {appearanceFields.map((key) => (
                      <div key={key} className="space-y-2">
                        <Label htmlFor={`og-f-${key}`}>{FIELD_LABEL[key]}</Label>
                        <Input
                          id={`og-f-${key}`}
                          value={fields[key] ?? ''}
                          placeholder={DEFAULT_VALUES[key]}
                          onChange={(e) => onField(key, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">Supported values: theme light/dark/classic, pattern none/dots/grid, colors as #RRGGBB.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        <div className="space-y-4">
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>1200×630 from your {siteConfig.name} app</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {!apiKey.trim() && (
                <p className="rounded-md border border-dashed bg-muted/30 p-3 text-sm text-muted-foreground">
                  Demo mode is active. Generated images include a watermark and are meant for evaluation before checkout.
                </p>
              )}
              {!(fields.title ?? '').trim() && (
                <p className="text-sm text-destructive">Title is required by the API.</p>
              )}
              {previewStatus === 'loading' && (
                <div className="flex w-full items-center justify-center rounded-md border bg-muted/30 text-sm text-muted-foreground" style={{ aspectRatio: '1200/630' }}>
                  Loading preview...
                </div>
              )}
              {previewUrl && previewStatus === 'ready' && (
                <div className="relative w-full overflow-hidden rounded-md border bg-muted/30" style={{ aspectRatio: '1200/630' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- dynamic OG response URL, not a static import */}
                  <img
                    key={requestedImageUrl}
                    src={previewUrl}
                    alt="OG preview"
                    className="h-full w-full object-contain object-top"
                  />
                </div>
              )}
              {previewStatus === 'error' && previewError && (
                <p className="text-sm text-destructive">
                  {previewError}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!cleanImageUrl}
                  onClick={() => void copyUrl()}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  {copyDone ? 'Copied' : 'Copy URL'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!(fields.title ?? '').trim()}
                  onClick={generatePreview}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Generate preview
                </Button>
              </div>
              {cleanImageUrl && (
                <pre className="max-h-32 overflow-auto break-all rounded-md border bg-muted/50 p-2 text-xs">
                  {cleanImageUrl}
                </pre>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
