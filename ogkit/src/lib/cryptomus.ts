/**
 * Cryptomus merchant API — create payment invoices (crypto checkout).
 * https://doc.cryptomus.com/merchant-api/payments/creating-invoice
 */
import { createHash } from 'node:crypto'

const CRYPTOMUS_API = 'https://api.cryptomus.com/v1'

function getMerchantId(): string | null {
  return process.env.CRYPTOMUS_MERCHANT_ID?.trim() ?? null
}

function getApiKey(): string | null {
  return process.env.CRYPTOMUS_API_KEY?.trim() ?? null
}

function signBody(body: Record<string, unknown>, apiKey: string): string {
  const json = JSON.stringify(body)
  const base64 = Buffer.from(json, 'utf-8').toString('base64')
  return createHash('md5').update(base64 + apiKey).digest('hex')
}

export interface CreateInvoiceParams {
  amount: string
  currency: string
  order_id: string
  url_success: string
  url_return: string
  url_callback: string
  additional_data?: string
}

export async function createPaymentInvoice(
  params: CreateInvoiceParams,
): Promise<{ url: string; order_id: string } | null> {
  const merchantId = getMerchantId()
  const apiKey = getApiKey()
  if (!merchantId || !apiKey) {
    return null
  }

  const body = {
    amount: params.amount,
    currency: params.currency,
    order_id: params.order_id,
    url_success: params.url_success,
    url_return: params.url_return,
    url_callback: params.url_callback,
    ...(params.additional_data != null ? { additional_data: params.additional_data } : {}),
  }

  const sign = signBody(body, apiKey)

  try {
    const res = await fetch(`${CRYPTOMUS_API}/payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        merchant: merchantId,
        sign,
      },
      body: JSON.stringify(body),
    })

    const data = (await res.json().catch(() => null)) as { result?: { url?: string; order_id?: string } } | null
    if (!res.ok) {
      console.warn('[Cryptomus] create invoice error:', res.status, data)
      return null
    }

    const result = data?.result
    const url = result?.url
    const orderId = result?.order_id ?? params.order_id
    if (url && typeof url === 'string') {
      return { url, order_id: String(orderId) }
    }
    console.warn('[Cryptomus] create invoice response missing url:', data)
    return null
  } catch (e) {
    console.warn('[Cryptomus] create invoice exception:', e)
    return null
  }
}

export function verifyWebhookSign(payload: Record<string, unknown>, receivedSign: string): boolean {
  const apiKey = getApiKey()
  if (!apiKey) return false
  const { sign: _, ...rest } = payload
  const json = JSON.stringify(rest)
  const base64 = Buffer.from(json, 'utf-8').toString('base64')
  const expected = createHash('md5').update(base64 + apiKey).digest('hex')
  return expected === receivedSign
}
