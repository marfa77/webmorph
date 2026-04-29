type TelegramMessage = {
  text: string
}

type TelegramSendResult =
  | { ok: true; skipped: false; chat?: { idSuffix: string; type?: string; title?: string; username?: string } }
  | { ok: false; skipped: true }
  | { ok: false; skipped: false; error?: string }

const TELEGRAM_API_BASE = 'https://api.telegram.org'

function getTelegramConfig() {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim()
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim()
  if (!token || !chatId) return null
  return { token, chatId }
}

export async function sendTelegramMessage({ text }: TelegramMessage): Promise<TelegramSendResult> {
  const config = getTelegramConfig()
  if (!config) return { ok: false, skipped: true as const }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 5000)

  try {
    const response = await fetch(`${TELEGRAM_API_BASE}/bot${config.token}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        chat_id: config.chatId,
        text,
        disable_web_page_preview: true,
      }),
      signal: controller.signal,
    })

    const body = await response.json().catch(() => null) as {
      ok?: boolean
      description?: string
      result?: { chat?: { id?: number | string; type?: string; title?: string; username?: string } }
    } | null

    if (!response.ok || body?.ok === false) {
      const description = body?.description ?? `HTTP ${response.status}`
      console.warn('Telegram notification failed', response.status, description)
      return { ok: false, skipped: false as const, error: description }
    }

    const chat = body?.result?.chat
    return {
      ok: true,
      skipped: false as const,
      chat: chat?.id
        ? {
            idSuffix: String(chat.id).slice(-4),
            type: chat.type,
            title: chat.title,
            username: chat.username,
          }
        : undefined,
    }
  } catch (error) {
    console.warn('Telegram notification failed', error)
    return { ok: false, skipped: false as const }
  } finally {
    clearTimeout(timeout)
  }
}
