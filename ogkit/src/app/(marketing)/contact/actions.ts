'use server'

import { sendTelegramMessage } from '@/lib/notifications/telegram'

export type ContactState = { status: 'idle' | 'success' | 'error'; message?: string }

export async function submitContact(_prev: ContactState, formData: FormData): Promise<ContactState> {
  const name    = (formData.get('name')    as string | null)?.trim() ?? ''
  const email   = (formData.get('email')   as string | null)?.trim() ?? ''
  const subject = (formData.get('subject') as string | null)?.trim() || 'General'
  const body    = (formData.get('body')    as string | null)?.trim() ?? ''
  const company = (formData.get('company') as string | null)?.trim()

  if (company) return { status: 'success' }

  if (!name || !email || body.length < 10) {
    return { status: 'error', message: 'Please fill in your name, email, and message (at least 10 characters).' }
  }

  const lines = [
    `New OGKit contact request`,
    `Subject: ${subject}`,
    '',
    `Name: ${name}`,
    `Reply to: ${email}`,
    '',
    `Message:`,
    body,
  ]

  const notification = await sendTelegramMessage({ text: lines.join('\n') })
  if (!notification.ok) {
    return {
      status: 'error',
      message: notification.skipped
        ? 'Contact form is not configured yet. Please try again later.'
        : 'Message could not be sent. Please try again later.',
    }
  }

  return { status: 'success' }
}
