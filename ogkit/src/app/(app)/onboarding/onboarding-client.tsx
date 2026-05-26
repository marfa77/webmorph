'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { withBasePath } from '@/config/paths'
import { siteConfig } from '@/config/site'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Check, Copy, ExternalLink } from 'lucide-react'

const STORAGE_KEY = 'ogkit_playground_api_key'

const MCP_JSON = `{
  "mcpServers": {
    "ogkit": {
      "url": "${siteConfig.url}/api/mcp"
    }
  }
}`

type BootstrapState =
  | { status: 'loading' }
  | { status: 'ready'; bootstrapped: boolean; key?: string; prefix: string | null }
  | { status: 'error'; message: string }

export function OnboardingClient() {
  const router = useRouter()
  const [bootstrap, setBootstrap] = useState<BootstrapState>({ status: 'loading' })
  const [keyCopied, setKeyCopied] = useState(false)
  const [mcpCopied, setMcpCopied] = useState(false)
  const [step, setStep] = useState(1)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const res = await fetch(withBasePath('/api/keys/bootstrap'), { method: 'POST' })
        const data = (await res.json()) as {
          bootstrapped?: boolean
          key?: string
          prefix?: string | null
          error?: string
        }
        if (!res.ok) {
          if (!cancelled) setBootstrap({ status: 'error', message: data.error ?? 'Could not prepare your account.' })
          return
        }
        if (!cancelled) {
          setBootstrap({
            status: 'ready',
            bootstrapped: Boolean(data.bootstrapped),
            key: data.key,
            prefix: data.prefix ?? null,
          })
        }
      } catch {
        if (!cancelled) setBootstrap({ status: 'error', message: 'Network error. Refresh to try again.' })
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const displayKey = bootstrap.status === 'ready' ? bootstrap.key : undefined

  const steps = useMemo(
    () => [
      { id: 1, title: 'API key', desc: 'Auto-created on first sign-in' },
      { id: 2, title: 'Playground', desc: 'Preview a real OG image' },
      { id: 3, title: 'Cursor MCP', desc: 'Connect agents in one paste' },
    ],
    [],
  )

  async function copyKey() {
    if (!displayKey) return
    await navigator.clipboard.writeText(displayKey)
    setKeyCopied(true)
    setTimeout(() => setKeyCopied(false), 2000)
  }

  async function copyMcpJson() {
    await navigator.clipboard.writeText(MCP_JSON)
    setMcpCopied(true)
    setTimeout(() => setMcpCopied(false), 2000)
  }

  function saveKeyAndOpenPlayground() {
    if (displayKey) {
      try {
        localStorage.setItem(STORAGE_KEY, displayKey)
      } catch {
        /* ignore */
      }
    }
    router.push(withBasePath('/playground'))
  }

  function finish() {
    router.push(withBasePath('/dashboard'))
  }

  return (
    <div className="container max-w-3xl space-y-8 py-10">
      <div>
        <h1 className="text-2xl font-bold">Get started with {siteConfig.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Three steps from sign-in to a production-ready Open Graph image URL — no checkout required.
        </p>
      </div>

      <ol className="grid gap-2 sm:grid-cols-3">
        {steps.map((s) => (
          <li
            key={s.id}
            className={`rounded-lg border px-3 py-2 text-sm ${step === s.id ? 'border-primary bg-primary/5' : 'bg-muted/20'}`}
          >
            <div className="font-medium">
              {step > s.id ? <Check className="mr-1 inline h-4 w-4 text-emerald-600" /> : null}
              Step {s.id}: {s.title}
            </div>
            <div className="text-xs text-muted-foreground">{s.desc}</div>
          </li>
        ))}
      </ol>

      {bootstrap.status === 'loading' && (
        <Card>
          <CardContent className="py-8 text-sm text-muted-foreground">Preparing your API key…</CardContent>
        </Card>
      )}

      {bootstrap.status === 'error' && (
        <Card className="border-destructive/40">
          <CardContent className="py-6 text-sm text-destructive">{bootstrap.message}</CardContent>
        </Card>
      )}

      {bootstrap.status === 'ready' && step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Your API key</CardTitle>
            <CardDescription>
              {bootstrap.bootstrapped
                ? 'We created a default key for you. Copy it now — it is shown only once.'
                : `You already have a key (${bootstrap.prefix ?? '…'}). Create another in API keys if needed.`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {displayKey ? (
              <>
                <pre className="overflow-x-auto rounded-md border bg-amber-50 p-3 font-mono text-xs text-amber-950 dark:bg-amber-950/30 dark:text-amber-100">
                  {displayKey}
                </pre>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" size="sm" onClick={() => void copyKey()}>
                    <Copy className="mr-2 h-4 w-4" />
                    {keyCopied ? 'Copied' : 'Copy key'}
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => setStep(2)}>
                    Continue
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Store as <code className="font-mono">OGKIT_API_KEY</code> in your deployment env.
                </p>
              </>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Your existing key prefix is <code className="font-mono">{bootstrap.prefix}</code>. Open keys to rotate or
                  create another.
                </p>
                <Button type="button" size="sm" onClick={() => setStep(2)}>
                  Continue
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {bootstrap.status === 'ready' && step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Open the Playground</CardTitle>
            <CardDescription>
              Pick a template, generate a 1200×630 preview, copy the URL or a Next.js <code className="font-mono">generateMetadata</code>{' '}
              snippet.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button type="button" size="sm" onClick={saveKeyAndOpenPlayground}>
              {displayKey ? 'Save key & open Playground' : 'Open Playground'}
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setStep(3)}>
              Skip to Cursor setup
            </Button>
          </CardContent>
        </Card>
      )}

      {bootstrap.status === 'ready' && step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Connect in Cursor</CardTitle>
            <CardDescription>
              Add the hosted MCP server so agents can build OG URLs, Next.js snippets, and validate pages without leaving
              the editor.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <pre className="max-h-40 overflow-auto rounded-md border bg-muted/40 p-3 font-mono text-xs">{MCP_JSON}</pre>
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" onClick={() => void copyMcpJson()}>
                <Copy className="mr-2 h-4 w-4" />
                {mcpCopied ? 'Copied' : 'Copy mcp.json'}
              </Button>
              <Button asChild size="sm" variant="outline">
                <a href="https://cursor.com/marketplace/publish" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Cursor Marketplace
                </a>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href={withBasePath('/docs')}>Read MCP docs</Link>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Plugin bundle:{' '}
              <a
                className="underline"
                href={`${siteConfig.github}/tree/main/ogkit/cursor-plugin`}
                target="_blank"
                rel="noopener noreferrer"
              >
                ogkit/cursor-plugin
              </a>{' '}
              (skill + rules). Submit the repo path at marketplace publish.
            </p>
            <Button type="button" onClick={finish}>
              Finish — open dashboard
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
