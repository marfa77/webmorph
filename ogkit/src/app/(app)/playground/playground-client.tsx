'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { getApiUrl } from '@/config/paths'
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
}

function buildImageUrl(
  baseOrigin: string,
  template: TemplateId,
  apiKey: string,
  fields: Record<string, string>,
  bust: number,
): string | null {
  const t = (fields.title ?? '').trim()
  if (!t || !apiKey.trim()) return null
  const params = new URLSearchParams()
  params.set('key', apiKey.trim())
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
  const [bust, setBust] = useState(0)
  const [copyDone, setCopyDone] = useState(false)
  const [loadError, setLoadError] = useState(false)

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
    return buildImageUrl(window.location.origin, template, apiKey, fields, bust)
  }, [template, apiKey, fields, bust])

  const cleanImageUrl = useMemo(() => {
    if (!imageUrl) return ''
    const u = new URL(imageUrl)
    u.searchParams.delete('_t')
    return u.toString()
  }, [imageUrl])

  const onField = useCallback((key: string, value: string) => {
    setFields((f) => ({ ...f, [key]: value }))
  }, [])

  const onTemplate = useCallback((t: string) => {
    setTemplate(t as TemplateId)
    setLoadError(false)
  }, [])

  const fieldKeys = TEMPLATE_FIELDS[template]
  const meta = TEMPLATE_META[template]

  async function copyUrl() {
    if (!cleanImageUrl) return
    await navigator.clipboard.writeText(cleanImageUrl)
    setCopyDone(true)
    setTimeout(() => setCopyDone(false), 2000)
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
                    href="/dashboard/keys"
                    className="text-xs text-muted-foreground underline hover:text-foreground"
                  >
                    Get a key
                  </Link>
                </div>
                <Input
                  id="og-key"
                  type="password"
                  autoComplete="off"
                  placeholder="ogk_live_…"
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value)
                    setLoadError(false)
                  }}
                />
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
                <p className="text-sm text-muted-foreground">Enter an API key to load the image.</p>
              )}
              {apiKey.trim() && !(fields.title ?? '').trim() && (
                <p className="text-sm text-destructive">Title is required by the API.</p>
              )}
              {imageUrl && (
                <div className="relative w-full overflow-hidden rounded-md border bg-muted/30" style={{ aspectRatio: '1200/630' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- dynamic OG response URL, not a static import */}
                  <img
                    key={imageUrl}
                    src={imageUrl}
                    alt="OG preview"
                    className="h-full w-full object-contain object-top"
                    onLoad={() => setLoadError(false)}
                    onError={() => setLoadError(true)}
                  />
                </div>
              )}
              {loadError && (
                <p className="text-sm text-destructive">
                  Could not load the image. Check the key, quota, and that URLs in fields are valid (http(s)).
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
                  disabled={!apiKey.trim() || !(fields.title ?? '').trim()}
                  onClick={() => {
                    setBust((n) => n + 1)
                    setLoadError(false)
                  }}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
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
