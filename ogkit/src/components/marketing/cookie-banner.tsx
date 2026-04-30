'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { withBasePath } from '@/config/paths'
import { Button } from '@/components/ui/button'

const STORAGE_KEY = 'ogkit_cookie_consent'

export function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true)
    } catch {
      // localStorage unavailable (SSR, private mode)
    }
  }, [])

  function accept() {
    try { localStorage.setItem(STORAGE_KEY, '1') } catch { /* noop */ }
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur px-4 py-3"
      role="region"
      aria-label="Cookie notice"
      aria-live="polite"
    >
      <div className="container max-w-6xl flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          We use essential cookies for authentication and session management. No tracking or advertising cookies.
          See our{' '}
          <Link href={withBasePath('/privacy')} className="underline hover:text-foreground">
            Privacy Policy
          </Link>
          .
        </p>
        <Button size="sm" className="shrink-0" onClick={accept}>
          Got it
        </Button>
      </div>
    </div>
  )
}
