'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type Status = { type: 'idle' | 'success' | 'error'; message?: string }

export function ContactForm() {
  const [status, setStatus] = useState<Status>({ type: 'idle' })
  const [pending, setPending] = useState(false)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setStatus({ type: 'idle' })

    const formData = new FormData(event.currentTarget)
    const payload = Object.fromEntries(formData.entries())

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const result = (await response.json().catch(() => ({}))) as { message?: string }

      if (!response.ok) {
        setStatus({ type: 'error', message: result.message ?? 'Message could not be sent. Please try again.' })
        return
      }

      setStatus({ type: 'success' })
      event.currentTarget.reset()
    } catch {
      setStatus({ type: 'error', message: 'Network error. Please try again.' })
    } finally {
      setPending(false)
    }
  }

  if (status.type === 'success') {
    return (
      <div className="rounded-lg border bg-muted/30 p-6 text-center">
        <p className="text-lg font-semibold">Message sent ✓</p>
        <p className="mt-1 text-sm text-muted-foreground">
          We&apos;ll get back to you within 1 business day.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={(event) => void onSubmit(event)} className="space-y-4">
      {/* honeypot */}
      <input type="text" name="company" tabIndex={-1} className="absolute h-0 w-0 overflow-hidden p-0 opacity-0" autoComplete="off" aria-hidden />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="name">Name *</Label>
          <Input id="name" name="name" placeholder="Your name" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email *</Label>
          <Input id="email" name="email" type="email" placeholder="you@example.com" required />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="subject">Subject</Label>
        <Select name="subject" defaultValue="General">
          <SelectTrigger id="subject">
            <SelectValue placeholder="Select subject" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="General">General question</SelectItem>
            <SelectItem value="API">API / integration</SelectItem>
            <SelectItem value="Billing">Billing / payment</SelectItem>
            <SelectItem value="Bug">Bug report</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="body">Message *</Label>
        <Textarea
          id="body"
          name="body"
          placeholder="Describe your question or issue..."
          rows={5}
          required
          minLength={10}
        />
      </div>

      {status.type === 'error' && (
        <p className="text-sm text-destructive">{status.message}</p>
      )}

      <Button type="submit" disabled={pending} className="w-full sm:w-auto">
        {pending ? 'Sending…' : 'Send message'}
      </Button>
    </form>
  )
}
