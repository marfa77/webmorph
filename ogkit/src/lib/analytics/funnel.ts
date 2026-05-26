import type { Json } from '@/lib/db/types'
import { db } from '@/lib/db'
import { funnelEvents } from '@/lib/db/schema'
import { sendTelegramMessage } from '@/lib/notifications/telegram'
import { and, desc, eq, isNull } from 'drizzle-orm'

export type FunnelEventName =
  | 'user_registered'
  | 'api_key_created'
  | 'first_preview_generated'
  | 'og_image_generated'
  | 'waitlist_requested'
  | 'checkout_started'
  | 'payment_completed'
  | 'mcp_tool_called'

type TrackFunnelEventInput = {
  eventName: FunnelEventName
  userId?: string | null
  email?: string | null
  source?: string
  properties?: Record<string, Json | undefined>
  notify?: boolean
}

const DEDUPE_EVENTS = ['user_registered', 'first_preview_generated'] as const

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

function isDuplicateKeyError(e: unknown): boolean {
  const err = e as { errno?: number; code?: string; message?: string }
  if (err.errno === 1062) return true
  const msg = err.message ?? ''
  return /duplicate|unique/i.test(msg)
}

export async function trackFunnelEvent(input: TrackFunnelEventInput) {
  try {
    const props = compactProperties(input.properties)
    const values = {
      userId: input.userId ?? null,
      email: input.email?.trim().toLowerCase() ?? null,
      eventName: input.eventName,
      source: input.source ?? 'server',
      properties: props,
    }

    const needsDedupe =
      Boolean(input.userId) &&
      (DEDUPE_EVENTS as readonly string[]).includes(input.eventName)

    if (needsDedupe) {
      const [existing] = await db
        .select()
        .from(funnelEvents)
        .where(and(eq(funnelEvents.userId, input.userId!), eq(funnelEvents.eventName, input.eventName)))
        .limit(1)

      if (existing) {
        if (input.notify && input.userId && existing.notifiedAt == null) {
          const notification = await sendTelegramMessage({ text: formatTelegramEvent(input) })
          if (notification.ok) {
            await db.update(funnelEvents).set({ notifiedAt: new Date() }).where(eq(funnelEvents.id, existing.id))
          }
        }
        return
      }
    }

    try {
      await db.insert(funnelEvents).values(values)
    } catch (e) {
      if (input.notify && input.userId && isDuplicateKeyError(e)) {
        const [existing] = await db
          .select({ id: funnelEvents.id })
          .from(funnelEvents)
          .where(
            and(
              eq(funnelEvents.userId, input.userId),
              eq(funnelEvents.eventName, input.eventName),
              isNull(funnelEvents.notifiedAt),
            ),
          )
          .limit(1)

        if (existing) {
          const notification = await sendTelegramMessage({ text: formatTelegramEvent(input) })
          if (notification.ok) {
            await db.update(funnelEvents).set({ notifiedAt: new Date() }).where(eq(funnelEvents.id, existing.id))
          }
        }
        return
      }

      if (!isDuplicateKeyError(e)) {
        console.warn('Funnel event insert failed', { eventName: input.eventName, error: e })
      }
      return
    }

    if (input.notify) {
      const parts = [eq(funnelEvents.eventName, input.eventName)]
      if (input.userId) parts.push(eq(funnelEvents.userId, input.userId))
      else if (input.email) parts.push(eq(funnelEvents.email, input.email.trim().toLowerCase()))

      const [inserted] = await db
        .select({ id: funnelEvents.id })
        .from(funnelEvents)
        .where(and(...parts))
        .orderBy(desc(funnelEvents.id))
        .limit(1)

      const notification = await sendTelegramMessage({ text: formatTelegramEvent(input) })
      if (notification.ok && inserted) {
        await db.update(funnelEvents).set({ notifiedAt: new Date() }).where(eq(funnelEvents.id, inserted.id))
      }
    }
  } catch (error) {
    console.warn('Funnel event tracking failed', { eventName: input.eventName, error })
  }
}

export function trackFunnelEventSoon(input: TrackFunnelEventInput) {
  void trackFunnelEvent(input)
}
