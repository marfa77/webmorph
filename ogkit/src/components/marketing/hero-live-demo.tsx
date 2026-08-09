'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Copy, RefreshCw } from 'lucide-react'
import { getApiUrl, withBasePath } from '@/config/paths'
import { TEMPLATE_META, type TemplateId } from '@/config/templates'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

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
    if (typeof window === 'undefined') return
    setRequestedUrl(buildDemoUrl(window.location.origin, template, title, subtitle, Date.now()))
    // Initial load only — later updates go through Generate.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
    <div className="w-full">
      <div
        className="relative w-full overflow-hidden bg-[var(--ogkit-ink)] animate-ogkit-reveal"
        style={{ aspectRatio: '1200/630' }}
      >
        {status === 'loading' && !previewUrl && (
          <div className="absolute inset-0 flex items-center justify-center font-mono text-sm text-white/50">
            Rendering 1200×630…
          </div>
        )}
        {previewUrl && (status === 'ready' || status === 'loading') && (
          // eslint-disable-next-line @next/next/no-img-element -- live OG API response
          <img
            src={previewUrl}
            alt="Live Open Graph preview from OGKit"
            className="h-full w-full object-cover"
          />
        )}
        {status === 'error' && error && (
          <div className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-rose-200">
            {error}
          </div>
        )}
      </div>

      <div className="border-t border-white/10 bg-[var(--ogkit-ink)] px-4 py-4 text-white sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 lg:flex-row lg:items-end">
          <label className="block min-w-0 flex-1 space-y-1.5">
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/45">Template</span>
            <select
              className="flex h-10 w-full rounded-md border border-white/15 bg-white/5 px-3 text-sm text-white"
              value={template}
              onChange={(e) => setTemplate(e.target.value as TemplateId)}
            >
              {DEMO_TEMPLATES.map((id) => (
                <option key={id} value={id} className="bg-[var(--ogkit-ink)]">
                  {TEMPLATE_META[id].title}
                </option>
              ))}
            </select>
          </label>
          <label className="block min-w-0 flex-[1.2] space-y-1.5">
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/45">Title</span>
            <Input
              className="h-10 border-white/15 bg-white/5 text-sm text-white placeholder:text-white/30"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>
          <label className="block min-w-0 flex-[1.2] space-y-1.5">
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/45">Subtitle</span>
            <Input
              className="h-10 border-white/15 bg-white/5 text-sm text-white placeholder:text-white/30"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
            />
          </label>
          <div className="flex flex-wrap gap-2 lg:pb-0.5">
            <Button
              type="button"
              size="sm"
              className="h-10 bg-[var(--ogkit-glow)] px-4 font-semibold text-[var(--ogkit-ink)] hover:bg-white"
              disabled={!title.trim()}
              onClick={generate}
            >
              <RefreshCw className="mr-2 h-3.5 w-3.5" />
              Generate
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-10 border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
              disabled={!title.trim()}
              onClick={() => void copyUrl()}
            >
              <Copy className="mr-2 h-3.5 w-3.5" />
              {copied ? 'Copied' : 'Copy URL'}
            </Button>
            <Button asChild type="button" size="sm" variant="ghost" className="h-10 text-white/70 hover:bg-white/10 hover:text-white">
              <Link href={withBasePath('/playground')}>Playground</Link>
            </Button>
          </div>
        </div>
        <p className="mx-auto mt-3 max-w-6xl truncate font-mono text-[11px] text-white/40">{displayUrl}</p>
      </div>
    </div>
  )
}
