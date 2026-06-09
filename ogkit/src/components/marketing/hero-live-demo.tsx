'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Copy, RefreshCw } from 'lucide-react'
import { getApiUrl, withBasePath } from '@/config/paths'
import { TEMPLATE_META, type TemplateId } from '@/config/templates'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const DEMO_TEMPLATES: TemplateId[] = ['article', 'minimal', 'product']

function buildDemoUrl(origin: string, template: TemplateId, title: string, subtitle: string, bust: number) {
  const params = new URLSearchParams()
  params.set('demo', '1')
  params.set('source', 'homepage')
  params.set('title', title.trim())
  if (subtitle.trim()) params.set('subtitle', subtitle.trim())
  if (bust) params.set('_t', String(bust))
  return `${origin}${getApiUrl(`/api/og/${template}`)}?${params.toString()}`
}

export function HeroLiveDemo() {
  const [template, setTemplate] = useState<TemplateId>('article')
  const [title, setTitle] = useState('Ship notes')
  const [subtitle, setSubtitle] = useState('One URL for og:image')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [requestedUrl, setRequestedUrl] = useState<string | null>(null)

  const displayUrl = useMemo(() => {
    if (typeof window === 'undefined') return '/api/og/article?demo=1&title=…'
    return buildDemoUrl(window.location.origin, template, title, subtitle, 0)
      .replace(window.location.origin, '')
      .replace(/\?_t=\d+/, '')
  }, [template, title, subtitle])

  useEffect(() => {
    if (!requestedUrl) return

    const controller = new AbortController()
    let objectUrl: string | null = null
    setStatus('loading')
    setError(null)

    void fetch(requestedUrl, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Preview failed (${response.status})`)
        const blob = await response.blob()
        objectUrl = URL.createObjectURL(blob)
        setPreviewUrl(objectUrl)
        setStatus('ready')
      })
      .catch((err: Error) => {
        if (err.name === 'AbortError') return
        setPreviewUrl(null)
        setStatus('error')
        setError('Could not load preview. Try again.')
      })

    return () => {
      controller.abort()
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [requestedUrl])

  function generate() {
    if (!title.trim() || typeof window === 'undefined') return
    setRequestedUrl(buildDemoUrl(window.location.origin, template, title, subtitle, Date.now()))
  }

  async function copyUrl() {
    if (typeof window === 'undefined' || !title.trim()) return
    const url = buildDemoUrl(window.location.origin, template, title, subtitle, 0)
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative">
      <div className="absolute inset-x-4 top-10 h-72 rounded-full bg-gradient-to-r from-cyan-400/30 via-blue-500/25 to-violet-500/25 blur-3xl" />
      <div className="relative rounded-[2rem] border border-white/60 bg-slate-950 p-3 shadow-2xl shadow-slate-950/25">
        <div className="flex items-center gap-2 border-b border-white/10 px-3 pb-3">
          <span className="h-3 w-3 rounded-full bg-rose-400" />
          <span className="h-3 w-3 rounded-full bg-amber-300" />
          <span className="h-3 w-3 rounded-full bg-emerald-400" />
          <span className="ml-3 truncate rounded-full bg-white/10 px-3 py-1 font-mono text-[11px] text-slate-300">
            {displayUrl}
          </span>
        </div>

        <div className="space-y-3 rounded-[1.45rem] bg-slate-900 p-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="hero-template" className="text-xs text-slate-400">
                Template
              </Label>
              <select
                id="hero-template"
                className="flex h-9 w-full rounded-md border border-white/10 bg-slate-950 px-2 text-sm text-white"
                value={template}
                onChange={(e) => setTemplate(e.target.value as TemplateId)}
              >
                {DEMO_TEMPLATES.map((id) => (
                  <option key={id} value={id}>
                    {TEMPLATE_META[id].title}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hero-title" className="text-xs text-slate-400">
                Title
              </Label>
              <Input
                id="hero-title"
                className="h-9 border-white/10 bg-slate-950 text-sm text-white"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="hero-subtitle" className="text-xs text-slate-400">
              Subtitle
            </Label>
            <Input
              id="hero-subtitle"
              className="h-9 border-white/10 bg-slate-950 text-sm text-white"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
            />
          </div>

          <div className="relative overflow-hidden rounded-xl border border-white/10 bg-slate-950" style={{ aspectRatio: '1200/630' }}>
            {status === 'idle' && (
              <div className="flex h-full items-center justify-center px-4 text-center text-sm text-slate-400">
                Watermarked demo — no signup. Click Generate.
              </div>
            )}
            {status === 'loading' && (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">Generating PNG…</div>
            )}
            {previewUrl && status === 'ready' && (
              // eslint-disable-next-line @next/next/no-img-element -- live OG API response
              <img src={previewUrl} alt="Live OG preview" className="h-full w-full object-contain object-top" />
            )}
            {status === 'error' && error && (
              <div className="flex h-full items-center justify-center px-4 text-center text-sm text-rose-300">{error}</div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" className="h-8" disabled={!title.trim()} onClick={generate}>
              <RefreshCw className="mr-2 h-3.5 w-3.5" />
              Generate
            </Button>
            <Button type="button" size="sm" variant="secondary" className="h-8" disabled={!title.trim()} onClick={() => void copyUrl()}>
              <Copy className="mr-2 h-3.5 w-3.5" />
              {copied ? 'Copied' : 'Copy URL'}
            </Button>
            <Button asChild type="button" size="sm" variant="ghost" className="h-8 text-slate-300 hover:text-white">
              <Link href={withBasePath('/playground')}>Full Playground →</Link>
            </Button>
          </div>
        </div>
      </div>
      <p className="mt-3 text-center text-xs text-slate-500">1200×630 PNG · demo=1 watermark · no API key</p>
    </div>
  )
}
