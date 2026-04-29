import { NextResponse } from 'next/server'
import { sendTelegramMessage } from '@/lib/notifications/telegram'

type ContactPayload = {
  name?: string
  email?: string
  subject?: string
  body?: string
  company?: string
}

export async function POST(request: Request) {
  let payload: ContactPayload
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json', message: 'Invalid request body.' }, { status: 400 })
  }

  const name = payload.name?.trim() ?? ''
  const email = payload.email?.trim() ?? ''
  const subject = payload.subject?.trim() || 'General'
  const body = payload.body?.trim() ?? ''
  const company = payload.company?.trim()

  if (company) return NextResponse.json({ ok: true })

  if (!name || !email || body.length < 10) {
    return NextResponse.json(
      { error: 'invalid_contact', message: 'Please fill in your name, email, and message.' },
      { status: 400 },
    )
  }

  const message = [
    'New OGKit contact request',
    `Subject: ${subject}`,
    '',
    `Name: ${name}`,
    `Reply to: ${email}`,
    '',
    'Message:',
    body,
  ].join('\n')

  const notification = await sendTelegramMessage({ text: message })

  if (!notification.ok) {
    return NextResponse.json(
      {
        error: notification.skipped ? 'telegram_not_configured' : 'telegram_failed',
        message: notification.skipped
          ? 'Contact form is not configured yet.'
          : 'Message could not be sent. Please try again later.',
      },
      { status: 502 },
    )
  }

  return NextResponse.json({ ok: true })
}
