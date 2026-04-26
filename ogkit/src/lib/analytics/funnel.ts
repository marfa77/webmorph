import type { Json } from '@/lib/supabase/database.types'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendTelegramMessage } from '@/lib/notifications/telegram'

export type FunnelEventName =
  | 'user_registered'
  | 'api_key_created'
  | 'first_preview_generated'
  | 'og_image_generated'
  | 'waitlist_requested'
  | 'checkout_started'
  | 'payment_completed'

type TrackFunnelEventInput = {
  eventName: FunnelEventName
  userId?: string | null
  email?: string | null
  source?: string
  properties?: Record<string, Json | undefined>
  notify?: boolean
}

function compactProperties(properties: Record<string, Json | undefined> = {}) {
  return Object.fromEntries(Object.entries(properties).filter(([, value]) => value !== undefined)) as Record<string, Json>
}

function formatTelegramEvent(input: TrackFunnelEventInput) {
  const lines = [`OGKit funnel: ${input.eventName}`]
  if (input.email) lines.push(`Email: ${input.email}`)
  if (input.userId) lines.push(`User: ${input.userId}`)
  if (input.source) lines.push(`Source: ${input.source}`)

  const props = compactProperties(input.properties)
  for (const [key, value] of Object.entries(props)) {
    if (value === null || typeof value === 'object') continue
    lines.push(`${key}: ${String(value)}`)
  }

  lines.push(`Time: ${new Date().toISOString()}`)
  return lines.join('\n')
}

export async function trackFunnelEvent(input: TrackFunnelEventInput) {
  try {
    const supabase = createAdminClient()
    const { data: inserted, error } = await supabase
      .from('funnel_events')
      .insert({
        user_id: input.userId ?? null,
        email: input.email?.trim().toLowerCase() ?? null,
        event_name: input.eventName,
        source: input.source ?? 'server',
        properties: compactProperties(input.properties),
      })
      .select('id')
      .maybeSingle()

    if (error) {
      const code = (error as { code?: string }).code
      const message = (error as { message?: string }).message ?? ''
      if (input.notify && input.userId && (code === '23505' || /unique|duplicate/i.test(message))) {
        const { data } = await supabase
          .from('funnel_events')
          .select('id')
          .eq('user_id', input.userId)
          .eq('event_name', input.eventName)
          .is('notified_at', null)
          .maybeSingle()

        if (data) {
          const notification = await sendTelegramMessage({ text: formatTelegramEvent(input) })
          if (notification.ok) {
            await supabase.from('funnel_events').update({ notified_at: new Date().toISOString() }).eq('id', data.id)
          }
        }
        return
      }

      if (code !== '23505' && !/unique|duplicate/i.test(message)) {
        console.warn('Funnel event insert failed', { eventName: input.eventName, code, message })
      }
    }

    if (input.notify) {
      const notification = await sendTelegramMessage({ text: formatTelegramEvent(input) })
      if (notification.ok && inserted?.id) {
        await supabase.from('funnel_events').update({ notified_at: new Date().toISOString() }).eq('id', inserted.id)
      }
    }
  } catch (error) {
    console.warn('Funnel event tracking failed', { eventName: input.eventName, error })
  }
}

export function trackFunnelEventSoon(input: TrackFunnelEventInput) {
  void trackFunnelEvent(input)
}
