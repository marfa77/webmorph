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

  if (!name || body.length < 10) {
    return { status: 'error', message: 'Please fill in your name and message (at least 10 characters).' }
  }

  const lines = [
    `📬 *New contact — ${subject}*`,
    '',
    `*Name:* ${name}`,
    email ? `*Email:* ${email}` : '',
    `*Message:*\n${body}`,
  ].filter(Boolean)

  await sendTelegramMessage({ text: lines.join('\n') })

  return { status: 'success' }
}
