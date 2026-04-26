'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { getApiUrl, withBasePath } from '@/config/paths'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

type Key = {
  id: string
  name: string
  prefix: string
  last_used_at: string | null
  created_at: string
  revoked_at: string | null
  allowed_domains: string[]
  require_signed_urls: boolean
}

export default function KeysPage() {
  const [keys, setKeys] = useState<Key[]>([])
  const [newKey, setNewKey] = useState<string | null>(null)
  const [origin, setOrigin] = useState('')

  const exampleTestUrl = useMemo(() => {
    if (!origin) return ''
    return `${origin}${getApiUrl('/api/og/minimal?key=KEY&title=Test')}`
  }, [origin])

  useEffect(() => {
    setOrigin(typeof window !== 'undefined' ? window.location.origin : '')
  }, [])

  const load = useCallback(async () => {
    const r = await fetch(getApiUrl('/api/keys'))
    const data = await r.json()
    if (r.ok) setKeys(data.keys ?? [])
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function create() {
    const r = await fetch(getApiUrl('/api/keys'), { method: 'POST', body: JSON.stringify({ name: 'default' }) })
    const data = await r.json()
    if (data.key) setNewKey(data.key)
    void load()
  }

  async function revoke(id: string) {
    if (!confirm('Revoke this key?')) return
    await fetch(getApiUrl(`/api/keys/${id}`), { method: 'DELETE' })
    void load()
  }

  async function updateSecurity(key: Key, patch: Partial<Pick<Key, 'allowed_domains' | 'require_signed_urls'>>) {
    const body = {
      allowedDomains: patch.allowed_domains ?? key.allowed_domains,
      requireSignedUrls: patch.require_signed_urls ?? key.require_signed_urls,
    }
    await fetch(getApiUrl(`/api/keys/${key.id}`), { method: 'PATCH', body: JSON.stringify(body) })
    void load()
  }

  return (
    <div className="container max-w-4xl space-y-6 py-8">
      <p>
        <Link href={withBasePath('/dashboard')} className="text-sm text-muted-foreground underline">
          ← Dashboard
        </Link>
      </p>
      <Card>
        <CardHeader>
          <CardTitle>API Keys</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {exampleTestUrl && (
            <div className="rounded-md border border-dashed bg-muted/30 p-3 text-sm">
              <div className="text-xs font-medium text-muted-foreground">Test in browser (replace KEY)</div>
              <code className="mt-1 block break-all text-xs">{exampleTestUrl}</code>
            </div>
          )}
          <p className="text-sm text-muted-foreground">
            See <Link href={withBasePath('/docs')} className="underline hover:text-foreground">API reference</Link> and{' '}
            <Link href={withBasePath('/playground')} className="underline hover:text-foreground">
              Playground
            </Link>
            .
          </p>
          <Button onClick={() => void create()}>Create key</Button>
          {newKey && (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm dark:border-amber-900/50 dark:bg-amber-950/40">
              <div className="font-medium">Copy now. You won&apos;t see it again.</div>
              <code className="mt-2 block break-all text-xs">{newKey}</code>
            </div>
          )}
          <ul className="space-y-3">
            {keys.map((k) => (
              <li key={k.id} className="rounded border p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium">{k.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {k.prefix}••• — last used {k.last_used_at ? new Date(k.last_used_at).toLocaleString() : 'never'}
                    </div>
                  </div>
                  {!k.revoked_at && (
                    <Button variant="destructive" size="sm" onClick={() => void revoke(k.id)}>
                      Revoke
                    </Button>
                  )}
                </div>
                {!k.revoked_at && (
                  <div className="mt-4 grid gap-3 border-t pt-3 sm:grid-cols-[1fr_auto] sm:items-end">
                    <div className="space-y-2">
                      <Label htmlFor={`domains-${k.id}`}>Allowed domains</Label>
                      <Input
                        id={`domains-${k.id}`}
                        defaultValue={k.allowed_domains.join(', ')}
                        placeholder="example.com, docs.example.com"
                        onBlur={(event) => {
                          const domains = event.currentTarget.value
                            .split(',')
                            .map((domain) => domain.trim().toLowerCase())
                            .filter(Boolean)
                          void updateSecurity(k, { allowed_domains: domains })
                        }}
                      />
                      <p className="text-xs text-muted-foreground">Optional. Include `domain=example.com` in generated URLs to enforce this key&apos;s allowlist.</p>
                    </div>
                    <div className="flex items-center gap-2 pb-2">
                      <Switch
                        id={`signed-${k.id}`}
                        checked={k.require_signed_urls}
                        onCheckedChange={(checked) => void updateSecurity(k, { require_signed_urls: checked })}
                      />
                      <Label htmlFor={`signed-${k.id}`} className="text-sm">
                        Require signed URLs
                      </Label>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
