type TelegramMessage = {
  text: string
}

const TELEGRAM_API_BASE = 'https://api.telegram.org'

function getTelegramConfig() {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim()
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim()
  if (!token || !chatId) return null
  return { token, chatId }
}

export async function sendTelegramMessage({ text }: TelegramMessage) {
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

    if (!response.ok) {
      const body = await response.text().catch(() => '')
      console.warn('Telegram notification failed', response.status, body)
      return { ok: false, skipped: false as const }
    }

    return { ok: true, skipped: false as const }
  } catch (error) {
    console.warn('Telegram notification failed', error)
    return { ok: false, skipped: false as const }
  } finally {
    clearTimeout(timeout)
  }
}
